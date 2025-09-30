/**
 * unified-validation.ts
 * 
 * Unified validation system that combines all validation logic into a single,
 * efficient system. Replaces multiple redundant validation files.
 */

import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

/**
 * Unified validation result
 */
export interface UnifiedValidationResult {
  isValid: boolean;
  isHelpRequest: boolean;
  isInappropriate: boolean;
  needsSupport: boolean;
  confidence: number;
  reason: string;
  suggestedAction: 'continue' | 'clarify' | 'redirect' | 'support' | 'warning' | 'retry';
  aiResponse?: string;
  sanitizedInput?: string;
  escalationTrigger?: any;
}

/**
 * Context for validation
 */
export interface ValidationContext {
  currentStep: string;
  currentField: string;
  conversationLength: number;
  retryCount: number;
  userRole: string;
  previousMessages: string[];
}

/**
 * Unified validation function that replaces all other validation systems
 */
export async function validateUserInput(
  userInput: string,
  context: ValidationContext,
  aiService?: any
): Promise<UnifiedValidationResult> {
  const input = userInput.trim();
  
  // 1. BASIC VALIDATION
  if (!input || input.length === 0) {
    return {
      isValid: false,
      isHelpRequest: false,
      isInappropriate: false,
      needsSupport: false,
      confidence: 1.0,
      reason: 'Empty input provided',
      suggestedAction: 'retry'
    };
  }
  
  if (input.length < 2) {
    return {
      isValid: false,
      isHelpRequest: false,
      isInappropriate: false,
      needsSupport: false,
      confidence: 0.9,
      reason: 'Input too short, please provide more information',
      suggestedAction: 'retry'
    };
  }
  
  // 2. INAPPROPRIATE CONTENT CHECK
  const inappropriateCheck = checkInappropriateContent(input);
  if (!inappropriateCheck.isAppropriate) {
    return {
      isValid: false,
      isHelpRequest: false,
      isInappropriate: true,
      needsSupport: false,
      confidence: 1.0,
      reason: inappropriateCheck.message || 'Inappropriate content detected',
      suggestedAction: 'warning'
    };
  }
  
  // 3. HELP REQUEST DETECTION
  const helpCheck = detectHelpRequest(input, context);
  if (helpCheck.isHelpRequest) {
    return {
      isValid: false,
      isHelpRequest: true,
      isInappropriate: false,
      needsSupport: helpCheck.needsSupport,
      confidence: helpCheck.confidence,
      reason: helpCheck.reason,
      suggestedAction: helpCheck.suggestedAction,
      escalationTrigger: helpCheck.escalationTrigger
    };
  }
  
  // 4. RELEVANCE CHECK (skip for qualifications with skip responses)
  if (context.currentField === 'qualifications') {
    const skipKeywords = ['none', 'n/a', 'na', 'skip', 'no qualifications', 'no certs', 'no certifications', 'don\'t have any', 'don\'t have', 'no formal', 'no official', 'nothing', 'not applicable', 'not relevant', 'no training', 'no education'];
    const hasSkipKeywords = skipKeywords.some(keyword => input.toLowerCase().includes(keyword));
    
    if (hasSkipKeywords) {
      // Skip relevance check for qualifications with skip responses
      return {
        isValid: true,
        isHelpRequest: false,
        isInappropriate: false,
        needsSupport: false,
        confidence: 0.9,
        reason: 'Valid skip response for qualifications',
        suggestedAction: 'continue',
        sanitizedInput: input
      };
    }
  }
  
  const relevanceCheck = await checkRelevance(input, context, aiService);
  if (!relevanceCheck.isRelevant) {
    return {
      isValid: false,
      isHelpRequest: false,
      isInappropriate: false,
      needsSupport: false,
      confidence: relevanceCheck.confidence,
      reason: relevanceCheck.reason,
      suggestedAction: 'clarify'
    };
  }
  
  // 5. AI-POWERED VALIDATION (if available)
  if (aiService) {
    // Special handling for equipment fields - be very lenient
    if (context.currentField === 'equipment') {
      // For equipment, only do basic validation, skip AI validation
      console.log('🔍 Equipment field - skipping AI validation for leniency');
    } else {
      const aiValidation = await validateWithAI(input, context, aiService);
      if (!aiValidation.isValid) {
        return {
          isValid: false,
          isHelpRequest: aiValidation.isHelpRequest || false,
          isInappropriate: false,
          needsSupport: false,
          confidence: aiValidation.confidence,
          reason: aiValidation.reason,
          suggestedAction: aiValidation.suggestedAction || 'retry'
        };
      }
    }
  }
  
  // 6. SUCCESSFUL VALIDATION
  return {
    isValid: true,
    isHelpRequest: false,
    isInappropriate: false,
    needsSupport: false,
    confidence: 0.8,
    reason: 'Input validated successfully',
    suggestedAction: 'continue',
    sanitizedInput: sanitizeInput(input)
  };
}

/**
 * Check for inappropriate content
 */
function checkInappropriateContent(content: string): {
  isAppropriate: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  categories: string[];
} {
  const lowerContent = content.toLowerCase();
  
  // Define inappropriate content categories with severity levels
  const inappropriatePatterns = {
    profanity: {
      severity: 'medium' as const,
      patterns: ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'crap', 'piss', 'hell', 'bloody', 'bugger', 'sod', 'twat', 'wanker']
    },
    violence: {
      severity: 'high' as const,
      patterns: ['kill', 'murder', 'violence', 'attack', 'hurt', 'harm', 'fight', 'beat', 'stab', 'shoot', 'bomb', 'threat', 'danger']
    },
    sexual: {
      severity: 'high' as const,
      patterns: ['sex', 'porn', 'nude', 'naked', 'sexual', 'intimate', 'adult', 'fetish', 'kink', 'orgasm', 'masturbat']
    },
    selfHarm: {
      severity: 'critical' as const,
      patterns: ['suicide', 'kill myself', 'end my life', 'self harm', 'cut myself', 'hurt myself', 'depression', 'anxiety', 'mental health']
    },
    substances: {
      severity: 'medium' as const,
      patterns: ['drug', 'alcohol', 'drunk', 'high', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis', 'alcohol', 'beer', 'wine', 'drinking']
    },
    discrimination: {
      severity: 'critical' as const,
      patterns: ['hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'discriminat', 'prejudice', 'bias', 'stereotype', 'offensive']
    }
  };
  
  const detectedCategories: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check each category
  for (const [category, config] of Object.entries(inappropriatePatterns)) {
    const hasMatch = config.patterns.some(pattern => lowerContent.includes(pattern));
    if (hasMatch) {
      detectedCategories.push(category);
      if (config.severity === 'critical' || 
          (config.severity === 'high' && maxSeverity !== 'critical') ||
          (config.severity === 'medium' && maxSeverity === 'low')) {
        maxSeverity = config.severity;
      }
    }
  }
  
  if (detectedCategories.length === 0) {
    return {
      isAppropriate: true,
      severity: 'low',
      categories: []
    };
  }
  
  // Generate appropriate error message based on severity
  let message = '';
  switch (maxSeverity) {
    case 'critical':
      message = 'This content contains inappropriate material that violates our community guidelines. Please provide professional information instead.';
      break;
    case 'high':
      message = 'Please keep your response professional and appropriate for a work environment.';
      break;
    case 'medium':
      message = 'Please use professional language when describing your skills and experience.';
      break;
    default:
      message = 'Please provide a more professional response.';
  }
  
  return {
    isAppropriate: false,
    severity: maxSeverity,
    message,
    categories: detectedCategories
  };
}

/**
 * Detect help requests
 */
function detectHelpRequest(input: string, context: ValidationContext): {
  isHelpRequest: boolean;
  needsSupport: boolean;
  confidence: number;
  reason: string;
  suggestedAction: 'continue' | 'clarify' | 'redirect' | 'support' | 'warning' | 'retry';
  escalationTrigger?: any;
} {
  const lowerInput = input.toLowerCase();
  
  // Explicit help patterns
  const explicitHelpPatterns = [
    /^\/help$/, /^help$/, /^get me (help|support|assistance)$/,
    /^i need help with (this|the) (form|platform|site|app)/,
    /^how do i use this/, /^i'?m? (stuck|lost|confused) (with|on) (this|the)/,
    /^(i )?(don'?t|can'?t) (understand|figure out|work out)/,
    /^this (isn'?t|is not) working/, /^(something'?s?|it'?s?) broken/,
    /^contact (support|customer service|someone)$/,
    /^i (need|want) to (speak|talk) to (someone|support|a human)$/
  ];
  
  for (const pattern of explicitHelpPatterns) {
    if (pattern.test(lowerInput)) {
      return {
        isHelpRequest: true,
        needsSupport: false,
        confidence: 0.95,
        reason: 'Explicit help request detected',
        suggestedAction: 'redirect'
      };
    }
  }
  
  // Contextual help patterns
  const contextualHelpPatterns = [
    /^(where|what|how|why|when) .*(help|support|contact)/,
    /^(can|could|would) (you|someone|anyone) help/,
    /^is there (someone|anyone|support)/,
    /\?.*\b(help|support|assistance)\b/,
    /^i'?m? (frustrated|annoyed|upset) (with|about)/,
    /^this (is|seems) (confusing|difficult|hard)/
  ];
  
  for (const pattern of contextualHelpPatterns) {
    if (pattern.test(lowerInput)) {
      return {
        isHelpRequest: true,
        needsSupport: false,
        confidence: 0.7,
        reason: 'Contextual help pattern detected',
        suggestedAction: 'clarify'
      };
    }
  }
  
  // Support escalation check - be more lenient
  // Skip escalation for equipment and hourlyRate fields to prevent false positives
  if (!['equipment', 'hourlyRate', 'wage'].includes(context.currentField) && (context.retryCount >= 5 || context.conversationLength > 50)) {
    return {
      isHelpRequest: true,
      needsSupport: true,
      confidence: 0.8,
      reason: 'Multiple attempts or long conversation detected',
      suggestedAction: 'support',
      escalationTrigger: {
        retryCount: context.retryCount,
        conversationLength: context.conversationLength,
        confidence: 0.8
      }
    };
  }
  
  return {
    isHelpRequest: false,
    needsSupport: false,
    confidence: 0.5,
    reason: 'No help patterns detected',
    suggestedAction: 'continue'
  };
}

/**
 * Check relevance to current field
 */
async function checkRelevance(input: string, context: ValidationContext, aiService?: any): Promise<{
  isRelevant: boolean;
  confidence: number;
  reason: string;
}> {
  const lowerInput = input.toLowerCase();
  
  // AI-POWERED RELEVANCE CHECK - Let AI determine everything
  if (!aiService) {
    // Fallback to basic validation if no AI service
    return {
      isRelevant: true,
      confidence: 0.7,
      reason: 'AI service not available - using fallback validation'
    };
  }

  try {
    const prompt = `Analyze if this user input is relevant to a ${context.currentField} field in a professional worker onboarding form:

"${input}"

Context:
- Field: ${context.currentField}
- User role: ${context.userRole}
- Conversation length: ${context.conversationLength}

Determine if the input is:
1. RELEVANT to the ${context.currentField} field
2. APPROPRIATE for professional context
3. COMPLETE enough to be useful

Be VERY lenient and accepting. Only reject if the input is clearly:
- Completely unrelated to the field
- Inappropriate/offensive content
- Nonsensical gibberish

For ${context.currentField} field, accept:
- Job titles, professions, skills (for skills field)
- Numbers, rates, prices (for wage fields)  
- Equipment, tools, materials (for equipment field)
- "None", "skip", "N/A" responses (for optional fields)
- Short responses that are still relevant

Respond with JSON:
{
  "isRelevant": boolean,
  "confidence": number (0-1),
  "reason": string
}`;

    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            isRelevant: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string()
          },
          required: ['isRelevant', 'confidence', 'reason']
        }),
        isStream: false,
      },
      aiService
    );

    if (!response.ok) {
      return {
        isRelevant: true,
        confidence: 0.7,
        reason: 'AI analysis failed - accepting input'
      };
    }
    
    const data = response.data as { isRelevant: boolean; confidence: number; reason: string };
    
    return {
      isRelevant: data.isRelevant || true,
      confidence: data.confidence || 0.8,
      reason: data.reason || 'AI analysis completed'
    };
  } catch (error) {
    console.error('AI relevance check failed:', error);
    // Fallback to accepting the input
    return {
      isRelevant: true,
      confidence: 0.7,
      reason: 'AI analysis failed - accepting input'
    };
  }
}

/**
 * AI-powered validation
 */
async function validateWithAI(
  input: string,
  context: ValidationContext,
  aiService: any
): Promise<{
  isValid: boolean;
  isHelpRequest: boolean;
  confidence: number;
  reason: string;
  suggestedAction?: 'continue' | 'clarify' | 'redirect' | 'support' | 'warning' | 'retry';
}> {
  try {
    const prompt = `Analyze this user input for a ${context.currentField} field in a professional worker onboarding form:

"${input}"

Check for:
1. Appropriateness for professional context (be VERY lenient - only flag clearly inappropriate content)
2. Relevance to ${context.currentField} field
3. Quality and completeness

IMPORTANT: For equipment fields, be very lenient. Equipment like "Baking soda, Mixers, Ovens" is perfectly appropriate for a baker. Only flag content that is clearly inappropriate, offensive, or unrelated to work equipment.

Respond with JSON:
{
  "isValid": boolean,
  "isHelpRequest": boolean,
  "confidence": number (0-1),
  "reason": string,
  "suggestedAction": string
}`;
    
    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: TypedSchema.object({
          properties: {
            isValid: TypedSchema.boolean(),
            isHelpRequest: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string(),
            suggestedAction: TypedSchema.string()
          },
          required: ['isValid', 'isHelpRequest', 'confidence', 'reason']
        }),
        isStream: false,
      },
      aiService
    );

    if (!response.ok) {
      return {
        isValid: true,
        isHelpRequest: false,
        confidence: 0.5,
        reason: 'AI validation failed, assuming valid'
      };
    }

    const result = response.data as any;
    const validActions: ('continue' | 'clarify' | 'redirect' | 'support' | 'warning' | 'retry')[] = 
      ['continue', 'clarify', 'redirect', 'support', 'warning', 'retry'];
    
    return {
      isValid: result.isValid || false,
      isHelpRequest: result.isHelpRequest || false,
      confidence: result.confidence || 0.5,
      reason: result.reason || 'AI validation completed',
      suggestedAction: validActions.includes(result.suggestedAction) ? result.suggestedAction : 'retry'
    };
  } catch (error) {
    console.error('AI validation error:', error);
    return {
      isValid: true,
      isHelpRequest: false,
      confidence: 0.5,
      reason: 'AI validation error, assuming valid'
    };
  }
}

/**
 * Sanitize user input
 */
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
}

/**
 * Check if input requires escalation to human support
 */
export function requiresEscalation(validation: UnifiedValidationResult): boolean {
  return validation.needsSupport || 
         (validation.isHelpRequest && validation.confidence > 0.8) ||
         validation.suggestedAction === 'support';
}

/**
 * Get escalation details for support team
 */
export function getEscalationDetails(
  validation: UnifiedValidationResult,
  context: ValidationContext,
  userInput: string
): {
  reason: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedAction: string;
  context: string;
} {
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
  let reason = validation.reason;
  
  if (validation.isInappropriate) {
    priority = 'medium';
    reason = 'Inappropriate content detected';
  } else if (validation.needsSupport) {
    priority = 'high';
    reason = 'User requires support assistance';
  } else if (validation.isHelpRequest && validation.confidence > 0.8) {
    priority = 'medium';
    reason = 'High confidence help request';
  }
  
  return {
    reason,
    priority,
    suggestedAction: validation.suggestedAction,
    context: `Step: ${context.currentStep}, Field: ${context.currentField}, Retry: ${context.retryCount}`
  };
}

/**
 * Generate validation response
 */
export function generateValidationResponse(
  validation: UnifiedValidationResult,
  context: ValidationContext
): string {
  if (validation.isValid) {
    return `Great! I've received your information. Let me process that and continue with your profile setup.`;
  }
  
  switch (validation.suggestedAction) {
    case 'warning':
      return `I noticed some inappropriate language in your response. Please keep your profile professional and appropriate for a work environment. Try again with a professional response.`;
      
    case 'support':
      return `I can see you're having some trouble. I've detected that you might need additional support. ${validation.reason}

Would you like to:
1. **Get Help** - Contact our support team
2. **Continue** - I'll guide you through this step
3. **Skip** - Move to the next section

Type 1, 2, or 3 to choose.`;
      
    case 'redirect':
      return `I understand you need help! Here are your options:

1. **View Tutorial** - I can guide you through each step
2. **Contact Support** - Get help from our team  
3. **Continue** - I'll help you complete your profile

Type 1, 2, or 3 to choose.`;
      
    case 'clarify':
      return `I want to make sure I understand correctly. Are you:

A) **Describing your professional experience** (continue with your answer)
B) **Asking for help with the platform** (I'll guide you)

Type A or B to clarify.`;
      
    case 'retry':
      return `I need a bit more information to help you. Please provide a more detailed response about your ${context.currentField}.`;
      
    default:
      return `I need more information to help you. Please provide a clear response about your ${context.currentField}.`;
  }
}
