import { useState, useCallback, useEffect, useRef } from 'react';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { useFirebase } from '@/context/FirebaseContext';
import { Schema } from '@firebase/ai';
import { StepInputConfig } from '@/app/types/form';

// ============================================================================
// TYPES
// ============================================================================

export type ChatStepType = "bot" | "user" | "input" | "sanitized" | "typing";

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
}

export interface OnboardingActions {
  handleInputChange: (name: string, value: any) => void;
  handleInputSubmit: (stepId: number, inputName: string) => Promise<void>;
  handleSanitizedConfirm: (fieldName: string, sanitized: string) => Promise<void>;
  handleSanitizedReformulate: (fieldName: string) => void;
  isActiveInputStep: (step: ChatStep, chatSteps: ChatStep[]) => boolean;
  setConfirmDisabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  setExpandedSummaryFields: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
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

export function useOnboardingFlow(requiredFields: RequiredField[]): OnboardingFlowReturn {
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
      error: null
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
        
        // After all retries failed, accept the user's input and continue
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
    };

    await attemptAICall();
  }, [state.formData, buildPromptFromFormData, performAICall, addChatStep, updateState]);

  const handleAIResponse = useCallback(async (aiResponse: AIResponse, fieldName: string, sanitized: string) => {
    const updatedFormData = { ...state.formData, [fieldName]: sanitized };
    const requiredFieldNames = requiredFields.map(f => f.name);
    const allFieldsFilled = requiredFieldNames.every(f => !!updatedFormData[f]);
    const nextFieldObj = getNextRequiredField(updatedFormData);

    updateState({
      formData: updatedFormData,
      isTyping: false
    });

    // Remove typing indicator
    const typingStep = state.chatSteps.find(s => s.type === 'typing');
    if (typingStep) {
      removeChatStep(typingStep.id);
    }

    // If AI provided a summary and all fields are filled, show the summary
    if (aiResponse.summary && allFieldsFilled) {
      setTimeout(() => {
        addChatStep({
          type: "bot",
          content: aiResponse.summary,
          isComplete: true
        });
      }, TYPING_DELAY_MS);
      return;
    }

    // If AI provided nextField/nextPrompt, proceed to next field
    if (aiResponse.nextField && aiResponse.nextPrompt && nextFieldObj) {
      const gigType = getGigType(updatedFormData.gigDescription || '');
      const prompt = aiResponse.nextPrompt.replace(/\{gigType\}/g, gigType);
      
      setTimeout(() => {
        addChatStep({
          type: "bot",
          content: prompt,
          isComplete: true
        });
        addChatStep({
          type: "input",
          inputConfig: {
            type: nextFieldObj.type as StepInputConfig['type'],
            name: nextFieldObj.name,
            label: nextFieldObj.label,
          },
          isComplete: false
        });
      }, TYPING_DELAY_MS);
      return;
    }

    // Fallback: If all fields are filled but no summary, show a default summary
    if (allFieldsFilled) {
      const summaryText = buildSummaryText(updatedFormData);
      
      setTimeout(() => {
        addChatStep({
          type: "bot",
          content: summaryText,
          isComplete: true
        });
      }, TYPING_DELAY_MS);
      return;
    }

    // Fallback: If not all fields are filled, proceed to next required field
    if (nextFieldObj) {
      const gigType = getGigType(updatedFormData.gigDescription || '');
      const prompt = nextFieldObj.defaultPrompt.replace(/\{gigType\}/g, gigType);
      
      setTimeout(() => {
        addChatStep({
          type: "bot",
          content: prompt,
          isComplete: true
        });
        addChatStep({
          type: "input",
          inputConfig: {
            type: nextFieldObj.type as StepInputConfig['type'],
            name: nextFieldObj.name,
            label: nextFieldObj.label,
          },
          isComplete: false
        });
      }, TYPING_DELAY_MS);
      return;
    }
  }, [state.formData, state.chatSteps, requiredFields, getNextRequiredField, updateState, removeChatStep, addChatStep]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleInputChange = useCallback((name: string, value: any) => {
    setState(prev => ({
      ...prev,
      formData: { ...prev.formData, [name]: value }
    }));
  }, []);

  const handleInputSubmit = useCallback(async (stepId: number, inputName: string) => {
    const value = state.formData[inputName];
    console.log('🔍 handleInputSubmit called:', { stepId, inputName, value });
    
    // Mark the current step as complete
    updateChatStep(stepId, { isComplete: true });
    
    // Add user's response
    addChatStep({
      type: "user",
      content: value,
      isComplete: true
    });

    updateState({ sanitizing: true });

    // Process input with AI
    await processUserInput(inputName, value);
  }, [state.formData, updateChatStep, addChatStep, updateState, processUserInput]);

  const handleSanitizedConfirm = useCallback(async (fieldName: string, sanitized: string) => {
    // Update form data and mark sanitized step as complete
    const updatedFormData = { ...state.formData, [fieldName]: sanitized };
    
    updateState({
      formData: updatedFormData,
      reformulateField: null
    });

    // Mark sanitized step as complete
    setState(prev => ({
      ...prev,
      chatSteps: prev.chatSteps.map(step =>
        step.type === "sanitized" && step.fieldName === fieldName 
          ? { ...step, isComplete: true } 
          : step
      ),
      isTyping: true
    }));

    // Add typing indicator
    const typingId = generateId();
    addChatStep({
      type: "typing",
      isComplete: false
    });

    try {
      const prompt = buildPromptFromFormData(updatedFormData, fieldName, sanitized);
      const aiResponse = await performAICall(prompt);
      await handleAIResponse(aiResponse, fieldName, sanitized);
    } catch (error) {
      console.error('AI processing failed:', error);
      updateState({ isTyping: false });
      
      // Remove typing indicator
      const typingStep = state.chatSteps.find(s => s.type === 'typing');
      if (typingStep) {
        removeChatStep(typingStep.id);
      }
      
      // Fallback: Use the same logic as successful case but without AI response
      const aiResponse: AIResponse = {
        sufficient: true,
        sanitized,
        nextField: '',
        nextPrompt: ''
      };
      await handleAIResponse(aiResponse, fieldName, sanitized);
    }
  }, [state.formData, state.chatSteps, buildPromptFromFormData, performAICall, handleAIResponse, updateState, addChatStep, removeChatStep]);

  const handleSanitizedReformulate = useCallback((fieldName: string) => {
    updateState({ reformulateField: fieldName });
    
    const fieldConfig = requiredFields.find(f => f.name === fieldName);
    if (!fieldConfig) return;

    const inputConfig: StepInputConfig = {
      name: fieldConfig.name,
      type: fieldConfig.type as StepInputConfig['type'],
      label: fieldConfig.label,
    };

    addChatStep({
      type: "input",
      inputConfig,
      isComplete: false
    });
  }, [requiredFields, updateState, addChatStep]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    ...state,
    handleInputChange,
    handleInputSubmit,
    handleSanitizedConfirm,
    handleSanitizedReformulate,
    isActiveInputStep: (step: ChatStep, chatSteps: ChatStep[]) => isActiveInputStep(step, chatSteps),
    setConfirmDisabled: (updater) => setState(prev => ({ ...prev, confirmDisabled: updater(prev.confirmDisabled) })),
    setExpandedSummaryFields: (updater) => setState(prev => ({ ...prev, expandedSummaryFields: updater(prev.expandedSummaryFields) }))
  };
} 