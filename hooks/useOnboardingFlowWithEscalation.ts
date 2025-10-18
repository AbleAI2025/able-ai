import { useState, useCallback, useEffect, useRef } from 'react';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { useFirebase } from '@/context/FirebaseContext';
import { Schema } from '@firebase/ai';
import { StepInputConfig } from '@/app/types/form';
import { detectEscalationTriggers, generateEscalationDescription, getEscalationResponseMessage, shouldAutoEscalate } from '@/utils/escalation-detection';
import { createEscalatedIssueClient } from '@/utils/client-escalation';

// ============================================================================
// TYPES
// ============================================================================

export type ChatStepType = "bot" | "user" | "input" | "sanitized" | "typing" | "escalation";

export interface ChatStep {
  id: number;
  type: ChatStepType;
  content?: string | React.ReactNode;
  inputConfig?: StepInputConfig;
  isComplete: boolean;
  sanitizedValue?: any;
  originalValue?: any;
  fieldName?: string;
  error?: string;
  escalationData?: {
    issueId?: string;
    issueType: string;
    reason: string;
  };
}

export interface RequiredField {
  name: string;
  type: string;
  label: string;
  defaultPrompt: string;
  validation?: (value: any) => boolean;
  transform?: (value: any) => any;
  required?: boolean;
  errorMessage?: string;
}

export interface AIResponse {
  sufficient: boolean;
  clarificationPrompt?: string;
  sanitized?: string;
  summary?: string;
  nextField?: string;
  nextPrompt?: string;
  error?: string;
}

export interface OnboardingState {
  formData: Record<string, any>;
  chatSteps: ChatStep[];
  isTyping: boolean;
  sanitizing: boolean;
  reformulateField: string | null;
  confirmDisabled: Record<string, boolean>;
  expandedSummaryFields: Record<string, boolean>;
  error: string | null;
  isEscalated: boolean;
  escalationIssueId?: string;
}

export interface OnboardingActions {
  handleInputChange: (name: string, value: any) => void;
  handleInputSubmit: (stepId: number, inputName: string) => Promise<void>;
  handleSanitizedConfirm: (fieldName: string, sanitized: string) => Promise<void>;
  handleSanitizedReformulate: (fieldName: string) => void;
  isActiveInputStep: (step: ChatStep, chatSteps: ChatStep[]) => boolean;
  setConfirmDisabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  setExpandedSummaryFields: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  handleEscalation: (userInput: string, context?: any) => Promise<void>;
}

export type OnboardingFlowReturn = OnboardingState & OnboardingActions;

// ============================================================================
// CONSTANTS
// ============================================================================

const AI_TIMEOUT_MS = 5000;
const AI_MAX_RETRIES = 2;
const AI_RETRY_DELAY_MS = 1000;
const TYPING_DELAY_MS = 700;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const generateId = () => Date.now() + Math.random();

const getGigType = (gigDescription: string): string => {
  return gigDescription
    .toLowerCase()
    .replace(/[^a-z0-9 ]/gi, '')
    .split(' ')[0] || 'worker';
};

const buildSummaryText = (formData: Record<string, any>): string => {
  return `Thank you! Here is a summary of your gig:
• Gig Description: ${formData.gigDescription || 'Not specified'}
• Additional Instructions: ${formData.additionalInstructions || 'None'}
• Hourly Rate: £${formData.hourlyRate || 'Not specified'}
• Location: ${typeof formData.gigLocation === 'object' ? 'Coordinates provided' : formData.gigLocation || 'Not specified'}
• Date: ${formData.gigDate || 'Not specified'}

Your gig request has been submitted!`;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOnboardingFlowWithEscalation(
  requiredFields: RequiredField[],
  userId: string,
  context?: {
    gigId?: string;
    userRole?: string;
  }
): OnboardingFlowReturn {
  const { ai } = useFirebase();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [state, setState] = useState<OnboardingState>(() => {
    const initialField = requiredFields[0];
    const initialSteps: ChatStep[] = [{
      id: generateId(),
      type: "bot",
      content: initialField?.defaultPrompt || "Hi! Let's get started with your gig.",
      isComplete: true
    }, {
      id: generateId(),
      type: "input",
      inputConfig: initialField ? {
        type: initialField.type as StepInputConfig['type'],
        name: initialField.name,
        label: initialField.label,
      } : undefined,
      isComplete: false
    }];

    return {
      formData: {},
      chatSteps: initialSteps,
      isTyping: false,
      sanitizing: false,
      reformulateField: null,
      confirmDisabled: {},
      expandedSummaryFields: {},
      error: null,
      isEscalated: false
    };
  });

  // ============================================================================
  // STATE UPDATERS
  // ============================================================================

  const updateState = useCallback((updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const addChatStep = useCallback((step: Omit<ChatStep, 'id'>) => {
    setState(prev => ({
      ...prev,
      chatSteps: [...prev.chatSteps, { ...step, id: generateId() }]
    }));
  }, []);

  const updateChatStep = useCallback((stepId: number, updates: Partial<ChatStep>) => {
    setState(prev => ({
      ...prev,
      chatSteps: prev.chatSteps.map(step => 
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  }, []);

  const removeChatStep = useCallback((stepId: number) => {
    setState(prev => ({
      ...prev,
      chatSteps: prev.chatSteps.filter(step => step.id !== stepId)
    }));
  }, []);

  // ============================================================================
  // ESCALATION HANDLING
  // ============================================================================

  const handleEscalation = useCallback(async (userInput: string, escalationContext?: any) => {
    try {
      // Detect escalation triggers
      const trigger = detectEscalationTriggers(userInput, {
        retryCount: retryCountRef.current,
        conversationLength: state.chatSteps.length,
        userRole: context?.userRole,
        gigId: context?.gigId,
        ...escalationContext
      });

      if (!trigger.shouldEscalate) {
        return;
      }

      // Generate escalation description
      const description = generateEscalationDescription(trigger, userInput, {
        gigId: context?.gigId,
        userRole: context?.userRole,
        conversationLength: state.chatSteps.length
      });

      // Create escalated issue in database via API
      const escalationResult = await createEscalatedIssueClient({
        userId,
        firestoreMessageId: escalationContext?.messageId,
        gigId: context?.gigId,
        issueType: trigger.issueType,
        description
      });

      if (escalationResult.success) {
        // Update state to mark as escalated
        updateState({
          isEscalated: true,
          escalationIssueId: escalationResult.issueId
        });

        // Add escalation step to chat
        const escalationMessage = getEscalationResponseMessage(trigger);
        
        addChatStep({
          type: "escalation",
          content: escalationMessage,
          isComplete: true,
          escalationData: {
            issueId: escalationResult.issueId,
            issueType: trigger.issueType,
            reason: trigger.reason
          }
        });

        console.log('🚨 Escalation triggered:', {
          issueId: escalationResult.issueId,
          trigger,
          description
        });
      }
    } catch (error) {
      console.error('❌ Failed to handle escalation:', error);
      // Don't fail the flow if escalation fails
    }
  }, [userId, context, state.chatSteps.length, updateState, addChatStep]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const getNextRequiredField = useCallback((currentFormData: Record<string, any>) => {
    return requiredFields.find(f => !currentFormData[f.name]);
  }, [requiredFields]);

  const isActiveInputStep = useCallback((step: ChatStep, chatSteps: ChatStep[]) => {
    const lastIncompleteInputStep = [...chatSteps]
      .reverse()
      .find(s => s.type === 'input' && !s.isComplete);
    return step.id === lastIncompleteInputStep?.id && !state.isTyping;
  }, [state.isTyping]);

  const buildPromptFromFormData = useCallback((currentFormData: Record<string, any>, lastField: string, lastValue: any) => {
    const requiredFieldNames = requiredFields.map(f => f.name);
    const gigType = getGigType(currentFormData.gigDescription || '');

    return `You are a very simple onboarding assistant. The user answered "${lastValue}" for "${lastField}".

RULES:
1. ALWAYS accept the user's answer unless it's completely empty
2. Never ask for clarification unless the field is empty
3. Move to the next question immediately
4. Use these default responses:
   - If the answer exists: { "sufficient": true, "sanitized": "(user's exact answer)", "nextField": "(next empty field)", "nextPrompt": "(next field's prompt)" }
   - If empty: { "sufficient": false, "clarificationPrompt": "Please provide a response" }

The only required fields are: ${requiredFieldNames.join(', ')}

Examples of GOOD responses to accept:
- "Live Singer capable of singing SZA songs" → ACCEPT
- "Bartender with showmanship" → ACCEPT  
- "Chef for private party" → ACCEPT
- "DJ for wedding" → ACCEPT

Respond as JSON: { sufficient: boolean, sanitized?: string, clarificationPrompt?: string, nextField?: string, nextPrompt?: string, summary?: string }`;
  }, [requiredFields]);

  const parseAIResponse = useCallback((data: any): Required<AIResponse> => {
    return {
      sufficient: typeof data.sufficient === 'boolean' ? data.sufficient : false,
      clarificationPrompt: typeof data.clarificationPrompt === 'string' ? data.clarificationPrompt : '',
      sanitized: typeof data.sanitized === 'string' ? data.sanitized : '',
      summary: typeof data.summary === 'string' ? data.summary : '',
      nextField: typeof data.nextField === 'string' ? data.nextField : '',
      nextPrompt: typeof data.nextPrompt === 'string' ? data.nextPrompt : '',
      error: typeof data.error === 'string' ? data.error : '',
    };
  }, []);

  // ============================================================================
  // AI PROCESSING
  // ============================================================================

  const performAICall = useCallback(async (prompt: string): Promise<AIResponse> => {
    const aiSchema = Schema.object({
      properties: {
        sufficient: Schema.boolean(),
        sanitized: Schema.string(),
        clarificationPrompt: Schema.string(),
        nextField: Schema.string(),
        nextPrompt: Schema.string(),
        summary: Schema.string(),
      },
      optionalProperties: ["sanitized", "clarificationPrompt", "nextField", "nextPrompt", "summary"]
    });

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutRef.current = setTimeout(() => reject(new Error('AI timeout')), AI_TIMEOUT_MS);
    });

    const aiCallPromise = geminiAIAgent(
      "gemini-2.5-flash-preview-05-20",
      { prompt, responseSchema: aiSchema },
      ai
    );

    try {
      const result = await Promise.race([aiCallPromise, timeoutPromise]) as any;
      return parseAIResponse(result.ok && result.data ? result.data : {});
    } catch (error) {
      console.log('🔍 AI call failed:', error);
      throw error;
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [ai, parseAIResponse]);

  const processUserInput = useCallback(async (fieldName: string, value: any) => {
    // Check for escalation triggers in user input
    if (typeof value === 'string') {
      await handleEscalation(value);
    }

    // If escalated, don't continue with normal processing
    if (state.isEscalated) {
      return;
    }

    // Special case for coordinates
    if (
      fieldName === 'gigLocation' &&
      value &&
      typeof value === 'object' &&
      'lat' in value &&
      'lng' in value
    ) {
      const coords = value as { lat: number; lng: number };
      const displayValue = `Location selected (${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`;
      
      addChatStep({
        type: "sanitized",
        content: displayValue,
        sanitizedValue: displayValue,
        originalValue: value,
        fieldName,
        isComplete: false
      });
      
      updateState({ sanitizing: false });
      return;
    }

    // Regular AI processing with retry logic
    const attemptAICall = async (retryCount = 0): Promise<void> => {
      try {
        const prompt = buildPromptFromFormData(state.formData, fieldName, value);
        const aiResponse = await performAICall(prompt);
        
        const finalValue = aiResponse.sanitized || value;
        
        addChatStep({
          type: "sanitized",
          content: finalValue,
          sanitizedValue: finalValue,
          originalValue: value,
          fieldName,
          isComplete: false
        });
        
        updateState({ sanitizing: false });
        retryCountRef.current = 0;
        
      } catch (error) {
        console.log(`🔍 AI call failed (attempt ${retryCount + 1}/${AI_MAX_RETRIES + 1}):`, error);
        
        if (retryCount < AI_MAX_RETRIES) {
          retryCountRef.current = retryCount + 1;
          setTimeout(() => attemptAICall(retryCount + 1), AI_RETRY_DELAY_MS);
          return;
        }
        
        // After all retries failed, check for escalation
        await handleEscalation(`AI processing failed after ${AI_MAX_RETRIES + 1} attempts`, {
          retryCount: retryCount + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        // If not escalated, accept the user's input and continue
        if (!state.isEscalated) {
          console.log('🔍 All AI retries failed, accepting user input and continuing...');
          addChatStep({
            type: "sanitized",
            content: value,
            sanitizedValue: value,
            originalValue: value,
            fieldName,
            isComplete: false
          });
          
          updateState({ sanitizing: false });
          retryCountRef.current = 0;
        }
      }
    };

    await attemptAICall();
  }, [state.formData, state.isEscalated, buildPromptFromFormData, performAICall, addChatStep, updateState, handleEscalation]);

  // ... rest of the implementation follows the same pattern as useOnboardingFlow.ts
  // but with escalation checks integrated throughout

  return {
    ...state,
    handleInputChange: () => {}, // Implement as needed
    handleInputSubmit: () => Promise.resolve(), // Implement as needed
    handleSanitizedConfirm: () => Promise.resolve(), // Implement as needed
    handleSanitizedReformulate: () => {}, // Implement as needed
    isActiveInputStep,
    setConfirmDisabled: () => {}, // Implement as needed
    setExpandedSummaryFields: () => {}, // Implement as needed
    handleEscalation
  };
}
