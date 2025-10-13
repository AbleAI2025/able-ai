/**
 * ai-response-validation.ts
 * 
 * AI-powered response validation and sanitization system.
 * Provides sophisticated content validation, cleaning, and
 * user confirmation flow for the onboarding process.
 */

import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

/**
 * Validate user response with AI assistance
 * Uses AI to provide comprehensive validation and suggestions
 */
export async function validateResponseWithAI(
  userResponse: string,
  fieldType: string,
  context: {
    currentStep: string;
    currentPrompt: string;
    previousMessages: string[];
  },
  aiService?: any
): Promise<{
  isValid: boolean;
  confidence: number;
  suggestions: string[];
  sanitizedContent?: string;
  requiresConfirmation: boolean;
}> {
  if (!aiService) {
    // Fallback validation without AI
    return {
      isValid: userResponse.trim().length > 0,
      confidence: 0.5,
      suggestions: [],
      requiresConfirmation: false
    };
  }
  
  try {
    const prompt = `
      You are validating user input for a professional worker onboarding form.
      
      Field Type: ${fieldType}
      Current Step: ${context.currentStep}
      Prompt: ${context.currentPrompt}
      
      User Response: "${userResponse}"
      
      Previous Context: ${context.previousMessages.slice(-3).join(' | ')}
      
      Please analyze this response and provide:
      1. Is it appropriate for a professional context?
      2. Is it relevant to the ${fieldType} field?
      3. Is it complete and useful?
      4. Does it need any cleaning or improvement?
      
      Respond with JSON:
      {
        "isValid": boolean,
        "confidence": number (0-1),
        "suggestions": string[],
        "sanitizedContent": string (if cleaning needed),
        "requiresConfirmation": boolean (if significant changes made)
      }
    `;
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            isValid: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            suggestions: TypedSchema.array(TypedSchema.string()),
            sanitizedContent: TypedSchema.string(),
            requiresConfirmation: TypedSchema.boolean()
          },
          required: ['isValid', 'confidence', 'suggestions']
        }),
        isStream: false,
      },
      aiService
    );

    if (!response.ok) {
      console.error('AI validation failed:', response.error);
      return {
        isValid: false,
        confidence: 0.5,
        suggestions: ['Please provide appropriate content'],
        sanitizedContent: userResponse,
        requiresConfirmation: false
      };
    }

    const result = response.data as any;
    
    return {
      isValid: result.isValid || false,
      confidence: result.confidence || 0.5,
      suggestions: result.suggestions || [],
      sanitizedContent: result.sanitizedContent,
      requiresConfirmation: result.requiresConfirmation || false
    };
  } catch (error) {
    console.error('AI validation error:', error);
    
    // Fallback validation
    return {
      isValid: userResponse.trim().length > 0,
      confidence: 0.5,
      suggestions: ['Unable to validate with AI. Please ensure your response is professional and relevant.'],
      requiresConfirmation: false
    };
  }
}

/**
 * Sanitize user response with AI assistance
 * Cleans and improves user input while maintaining meaning
 */
export async function sanitizeResponseWithAI(
  userResponse: string,
  fieldType: string,
  aiService?: any
): Promise<{
  sanitizedContent: string;
  changes: string[];
  confidence: number;
}> {
  if (!aiService) {
    // Basic sanitization without AI
    const sanitized = userResponse
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '');
    
    return {
      sanitizedContent: sanitized,
      changes: sanitized !== userResponse ? ['Basic text cleaning applied'] : [],
      confidence: 0.5
    };
  }
  
  try {
    const prompt = `
      Clean and improve this user input for a professional worker onboarding form:
      
      Field Type: ${fieldType}
      Original Response: "${userResponse}"
      
      Please:
      1. Fix any spelling or grammar errors
      2. Remove inappropriate language
      3. Make it more professional
      4. Keep the original meaning and intent
      5. Ensure it's relevant to ${fieldType}
      
      Respond with JSON:
      {
        "sanitizedContent": string,
        "changes": string[] (list of changes made),
        "confidence": number (0-1)
      }
    `;
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            isValid: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            suggestions: TypedSchema.array(TypedSchema.string()),
            sanitizedContent: TypedSchema.string(),
            requiresConfirmation: TypedSchema.boolean()
          },
          required: ['isValid', 'confidence', 'suggestions']
        }),
        isStream: false,
      },
      aiService
    );

    if (!response.ok) {
      console.error('AI validation failed:', response.error);
      return {
        sanitizedContent: userResponse,
        changes: ['AI validation failed'],
        confidence: 0.5
      };
    }

    const result = response.data as any;
    
    return {
      sanitizedContent: result.sanitizedContent || userResponse,
      changes: result.changes || [],
      confidence: result.confidence || 0.5
    };
  } catch (error) {
    console.error('AI sanitization error:', error);
    
    // Fallback sanitization
    const sanitized = userResponse
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, '');
    
    return {
      sanitizedContent: sanitized,
      changes: ['Basic text cleaning applied (AI unavailable)'],
      confidence: 0.3
    };
  }
}

/**
 * Process validated response and handle user confirmation
 * Manages the flow of validated content and user confirmation
 */
export async function processValidatedResponse(
  userResponse: string,
  validationResult: {
    isValid: boolean;
    confidence: number;
    suggestions: string[];
    sanitizedContent?: string;
    requiresConfirmation: boolean;
  },
  onConfirm: (content: string) => void,
  onReject: () => void
): Promise<{
  processed: boolean;
  finalContent?: string;
  needsUserConfirmation: boolean;
}> {
  // If validation failed, don't process
  if (!validationResult.isValid) {
    return {
      processed: false,
      needsUserConfirmation: false
    };
  }
  
  // If no sanitization needed, process directly
  if (!validationResult.sanitizedContent || !validationResult.requiresConfirmation) {
    const finalContent = validationResult.sanitizedContent || userResponse;
    onConfirm(finalContent);
    
    return {
      processed: true,
      finalContent,
      needsUserConfirmation: false
    };
  }
  
  // If sanitization needed and requires confirmation, return for user confirmation
  return {
    processed: false,
    needsUserConfirmation: true
  };
}

/**
 * Generate confirmation message for sanitized content
 * Creates user-friendly confirmation messages
 */
export function generateConfirmationMessage(
  originalContent: string,
  sanitizedContent: string,
  changes: string[]
): string {
  if (changes.length === 0) {
    return 'Your response looks good!';
  }
  
  const changeList = changes.join(', ');
  return `I've cleaned up your response: ${changeList}. Does this look correct?`;
}

/**
 * Handle user confirmation of sanitized content
 * Processes user's confirmation or rejection of AI-suggested changes
 */
export function handleUserConfirmation(
  userChoice: 'accept' | 'reject',
  originalContent: string,
  sanitizedContent: string,
  onAccept: (content: string) => void,
  onReject: () => void
): void {
  if (userChoice === 'accept') {
    onAccept(sanitizedContent);
  } else {
    onReject();
  }
}

