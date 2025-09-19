/**
 * Enhanced validation system for onboarding-ai
 * Implements comprehensive checks: inappropriate content, off-topic, AI validation
 */

export interface ValidationResult {
  isValid: boolean;
  checks: {
    inappropriate: boolean;
    offTopic: boolean;
    aiValidation: boolean;
  };
  errors: string[];
  warnings: string[];
  sanitizedValue?: string;
  naturalSummary?: string;
  extractedData?: string;
}

export interface ValidationContext {
  fieldName: string;
  fieldType: string;
  conversationHistory: string[];
  previousData: Record<string, any>;
  userBehaviorPattern: 'normal' | 'suspicious' | 'help-seeking';
}

/**
 * Comprehensive validation function that runs all checks
 */
export async function validateUserInput(
  input: string,
  context: ValidationContext,
  ai?: any
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: true,
    checks: {
      inappropriate: true,
      offTopic: true,
      aiValidation: true
    },
    errors: [],
    warnings: [],
    sanitizedValue: input.trim()
  };

  // 1. Inappropriate Content Check
  const inappropriateCheck = checkInappropriateContent(input, context);
  if (!inappropriateCheck.isAppropriate) {
    result.checks.inappropriate = false;
    result.isValid = false;
    result.errors.push(`Inappropriate content detected: ${inappropriateCheck.reason}`);
  }

  // 2. Off-topic Check
  const offTopicCheck = checkOffTopic(input, context);
  if (!offTopicCheck.isOnTopic) {
    result.checks.offTopic = false;
    result.warnings.push(`Content may be off-topic: ${offTopicCheck.reason}`);
    // Off-topic is a warning, not a hard failure
  }

  // 3. AI Validation (if AI is available)
  if (ai && result.checks.inappropriate) {
    try {
      const aiValidation = await performAIValidation(input, context, ai);
      if (!aiValidation.isValid) {
        result.checks.aiValidation = false;
        result.isValid = false;
        result.errors.push(`AI validation failed: ${aiValidation.reason}`);
      } else {
        result.sanitizedValue = aiValidation.sanitizedValue;
        result.naturalSummary = aiValidation.naturalSummary;
        result.extractedData = aiValidation.extractedData;
      }
    } catch (error) {
      console.warn('AI validation failed, using fallback:', error);
      result.warnings.push('AI validation unavailable, using basic validation');
    }
  }

  return result;
}

/**
 * Check for inappropriate content
 */
function checkInappropriateContent(
  input: string, 
  context: ValidationContext
): { isAppropriate: boolean; reason: string; severity: 'mild' | 'moderate' | 'severe' } {
  const lowerInput = input.toLowerCase();
  
  // Severe inappropriate patterns
  const severePatterns = [
    /\b(fuck|shit|damn|bitch|asshole|bastard)\b/i,
    /\b(kill|murder|violence|hate|destroy)\b/i,
    /\b(sex|porn|nude|naked|erotic)\b/i,
    /\b(drug|cocaine|heroin|marijuana|weed)\b/i,
    /\b(illegal|crime|criminal|theft|steal)\b/i
  ];

  // Moderate inappropriate patterns
  const moderatePatterns = [
    /\b(stupid|idiot|dumb|moron)\b/i,
    /\b(fat|ugly|gross|disgusting)\b/i,
    /\b(weird|strange|creepy|scary)\b/i
  ];

  // Check for severe patterns
  for (const pattern of severePatterns) {
    if (pattern.test(lowerInput)) {
      return {
        isAppropriate: false,
        reason: 'Contains severe inappropriate language',
        severity: 'severe'
      };
    }
  }

  // Check for moderate patterns
  for (const pattern of moderatePatterns) {
    if (pattern.test(lowerInput)) {
      return {
        isAppropriate: false,
        reason: 'Contains moderate inappropriate language',
        severity: 'moderate'
      };
    }
  }

  // Check for excessive repetition (spam-like behavior)
  const words = input.split(/\s+/);
  const wordCount = words.length;
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / wordCount;
  
  if (wordCount > 10 && repetitionRatio < 0.3) {
    return {
      isAppropriate: false,
      reason: 'Excessive repetition detected',
      severity: 'moderate'
    };
  }

  return { isAppropriate: true, reason: '', severity: 'mild' };
}

/**
 * Check if content is off-topic for worker profile creation
 */
function checkOffTopic(
  input: string,
  context: ValidationContext
): { isOnTopic: boolean; reason: string } {
  const lowerInput = input.toLowerCase();
  
  // Off-topic patterns
  const offTopicPatterns = [
    // Help requests
    /\b(help|support|assistance|problem|issue|error|bug|fix)\b/i,
    // Personal complaints
    /\b(hate|dislike|annoying|frustrated|angry|upset)\b/i,
    // Random content
    /\b(weather|food|movie|game|sports|politics|religion)\b/i,
    // Nonsense
    /\b(asdf|qwerty|test|testing|random|nonsense)\b/i,
    // Fictional content
    /\b(character|story|fiction|fantasy|superhero|anime)\b/i
  ];

  // Check for off-topic patterns
  for (const pattern of offTopicPatterns) {
    if (pattern.test(lowerInput)) {
      return {
        isOnTopic: false,
        reason: 'Content appears to be off-topic for worker profile creation'
      };
    }
  }

  // Check if input is too short or generic
  if (input.trim().length < 3) {
    return {
      isOnTopic: false,
      reason: 'Input is too short to be meaningful'
    };
  }

  // Check for excessive special characters
  const specialCharRatio = (input.match(/[^a-zA-Z0-9\s]/g) || []).length / input.length;
  if (specialCharRatio > 0.3) {
    return {
      isOnTopic: false,
      reason: 'Contains excessive special characters'
    };
  }

  return { isOnTopic: true, reason: '' };
}

/**
 * Perform AI validation using Gemini
 */
async function performAIValidation(
  input: string,
  context: ValidationContext,
  ai: any
): Promise<{
  isValid: boolean;
  reason: string;
  sanitizedValue: string;
  naturalSummary: string;
  extractedData: string;
}> {
  try {
    const { Schema } = await import('@firebase/ai');
    const { geminiAIAgent } = await import('@/lib/firebase/ai');
    
    const validationSchema = Schema.object({
      properties: {
        isAppropriate: Schema.boolean(),
        isWorkerRelated: Schema.boolean(),
        isSufficient: Schema.boolean(),
        clarificationPrompt: Schema.string(),
        sanitizedValue: Schema.string(),
        naturalSummary: Schema.string(),
        extractedData: Schema.string()
      },
      required: ['isAppropriate', 'isWorkerRelated', 'isSufficient', 'sanitizedValue', 'naturalSummary', 'extractedData']
    });

    const prompt = `You are validating user input for a worker profile creation system.

CONTEXT:
- Field: ${context.fieldName} (${context.fieldType})
- User is creating a worker profile to find gig opportunities
- Previous conversation: ${context.conversationHistory.slice(-3).join(' | ')}
- Previous data: ${JSON.stringify(context.previousData, null, 2)}

USER INPUT: "${input}"

VALIDATION REQUIREMENTS:
1. isAppropriate: Check if content is appropriate for professional worker profile
2. isWorkerRelated: Check if content relates to worker skills/experience
3. isSufficient: Check if content provides meaningful information
4. sanitizedValue: Clean version of the input
5. naturalSummary: Natural language confirmation for the user
6. extractedData: JSON string of extracted structured data

RESPOND WITH:
- isAppropriate: boolean
- isWorkerRelated: boolean  
- isSufficient: boolean
- clarificationPrompt: string (if validation fails)
- sanitizedValue: string (cleaned version)
- naturalSummary: string (confirmation question)
- extractedData: string (JSON of extracted data)

Be strict about inappropriate content but lenient about worker-related content.`;

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: validationSchema,
        isStream: false,
      },
      ai
    );

    if (result.ok && result.data) {
      const validation = result.data as any;
      
      if (!validation.isAppropriate || !validation.isWorkerRelated || !validation.isSufficient) {
        return {
          isValid: false,
          reason: validation.clarificationPrompt || 'AI validation failed',
          sanitizedValue: validation.sanitizedValue || input,
          naturalSummary: validation.naturalSummary || 'Please provide valid information',
          extractedData: validation.extractedData || '{}'
        };
      }

      return {
        isValid: true,
        reason: '',
        sanitizedValue: validation.sanitizedValue || input,
        naturalSummary: validation.naturalSummary || 'Information looks good',
        extractedData: validation.extractedData || '{}'
      };
    }

    throw new Error('AI validation failed');
  } catch (error) {
    console.error('AI validation error:', error);
    return {
      isValid: false,
      reason: 'AI validation service unavailable',
      sanitizedValue: input,
      naturalSummary: 'Please try again',
      extractedData: '{}'
    };
  }
}
