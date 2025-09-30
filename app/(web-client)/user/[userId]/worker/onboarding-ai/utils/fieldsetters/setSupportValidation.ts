/**
 * setSupportValidation.ts
 * 
 * Modularized function for support validation and escalation detection.
 * Provides comprehensive support-related validation, escalation detection,
 * and user assistance flow integration.
 */

import { detectEscalationTriggers, generateEscalationDescription, shouldAutoEscalate, getEscalationResponseMessage } from '@/utils/escalation-detection';
import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

/**
 * Support validation result interface
 */
export interface SupportValidationResult {
  needsSupport: boolean;
  escalationTrigger?: {
    shouldEscalate: boolean;
    reason: string;
    issueType: string;
    confidence: number;
  };
  supportMessage?: string;
  shouldAutoEscalate?: boolean;
  suggestedAction?: string;
}

/**
 * Validate user input for support-related issues and escalation triggers
 * Detects when user input indicates need for human support or escalation
 */
export function setSupportValidation(
  userInput: string,
  context?: {
    retryCount?: number;
    conversationLength?: number;
    userRole?: string;
    fieldType?: string;
    currentStep?: string;
  }
): SupportValidationResult {
  // Detect escalation triggers
  const escalationTrigger = detectEscalationTriggers(userInput, {
    retryCount: context?.retryCount,
    conversationLength: context?.conversationLength,
    userRole: context?.userRole
  });

  // If no escalation detected, return normal result
  if (!escalationTrigger.shouldEscalate) {
    return {
      needsSupport: false,
      escalationTrigger: {
        shouldEscalate: false,
        reason: 'No escalation triggers detected',
        issueType: 'none',
        confidence: 0
      }
    };
  }

  // Determine if auto-escalation should occur
  const shouldAuto = shouldAutoEscalate(escalationTrigger);
  
  // Get appropriate support message
  const supportMessage = getEscalationResponseMessage(escalationTrigger);
  
  // Determine suggested action based on escalation type
  let suggestedAction = 'continue_normal_flow';
  if (escalationTrigger.issueType === 'technical_problem') {
    suggestedAction = 'escalate_to_technical_support';
  } else if (escalationTrigger.issueType === 'payment_issue') {
    suggestedAction = 'escalate_to_billing_support';
  } else if (escalationTrigger.issueType === 'safety_concern') {
    suggestedAction = 'escalate_to_safety_team';
  } else if (escalationTrigger.issueType === 'urgent_request') {
    suggestedAction = 'escalate_immediately';
  } else {
    suggestedAction = 'escalate_to_general_support';
  }

  return {
    needsSupport: true,
    escalationTrigger: {
      shouldEscalate: escalationTrigger.shouldEscalate,
      reason: escalationTrigger.reason,
      issueType: escalationTrigger.issueType,
      confidence: escalationTrigger.confidence
    },
    supportMessage,
    shouldAutoEscalate: shouldAuto,
    suggestedAction
  };
}

/**
 * Enhanced support validation with AI assistance
 * Uses AI to provide more sophisticated support detection
 */
export async function setSupportValidationWithAI(
  userInput: string,
  context?: {
    retryCount?: number;
    conversationLength?: number;
    userRole?: string;
    fieldType?: string;
    currentStep?: string;
  },
  aiService?: any
): Promise<SupportValidationResult> {
  // First, run basic escalation detection
  const basicResult = setSupportValidation(userInput, context);
  
  // If no AI service available, return basic result
  if (!aiService) {
    return basicResult;
  }

  // If basic detection found escalation, return it
  if (basicResult.needsSupport) {
    return basicResult;
  }

  // Use AI to detect more subtle support needs
  try {
    const prompt = `
      Analyze this user input for subtle signs of needing support or escalation:
      
      User Input: "${userInput}"
      Context: ${JSON.stringify(context)}
      
      Look for:
      1. Frustration or confusion
      2. Technical difficulties
      3. Process confusion
      4. Emotional distress
      5. Unclear instructions
      
      Respond with JSON:
      {
        "needsSupport": boolean,
        "confidence": number (0-1),
        "reason": string,
        "issueType": string,
        "suggestedAction": string
      }
    `;
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            needsSupport: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string(),
            issueType: TypedSchema.string(),
            suggestedAction: TypedSchema.string()
          },
          required: ['needsSupport', 'confidence', 'reason', 'issueType', 'suggestedAction']
        }),
        isStream: false,
      },
      aiService
    );

    if (!response.ok) {
      console.error('AI support validation failed:', response.error);
      return { needsSupport: false };
    }

    const aiResult = response.data as any;
    
    if (aiResult.needsSupport && aiResult.confidence > 0.7) {
      return {
        needsSupport: true,
        escalationTrigger: {
          shouldEscalate: true,
          reason: aiResult.reason || 'AI detected support need',
          issueType: aiResult.issueType || 'ai_detected_issue',
          confidence: aiResult.confidence
        },
        supportMessage: `I can see you might need some help with this. ${aiResult.suggestedAction || 'Let me connect you with our support team.'}`,
        shouldAutoEscalate: aiResult.confidence > 0.8,
        suggestedAction: aiResult.suggestedAction || 'escalate_to_support'
      };
    }
  } catch (error) {
    console.error('AI support validation error:', error);
  }
  
  // Return basic result if AI analysis fails
  return basicResult;
}

/**
 * Generate support case description for escalation
 */
export function generateSupportCaseDescription(
  userInput: string,
  escalationTrigger: any,
  context?: {
    fieldType?: string;
    currentStep?: string;
    retryCount?: number;
  }
): string {
  const baseDescription = `Support case generated from ${context?.fieldType || 'unknown'} field validation`;
  
  let description = baseDescription;
  description += `\n\nEscalation Reason: ${escalationTrigger.reason}`;
  description += `\nIssue Type: ${escalationTrigger.issueType}`;
  description += `\nConfidence: ${escalationTrigger.confidence}`;
  
  if (context?.currentStep) {
    description += `\nCurrent Step: ${context.currentStep}`;
  }
  
  if (context?.retryCount) {
    description += `\nRetry Count: ${context.retryCount}`;
  }
  
  description += `\nUser Input: "${userInput.substring(0, 200)}${userInput.length > 200 ? '...' : ''}"`;
  
  return description;
}
