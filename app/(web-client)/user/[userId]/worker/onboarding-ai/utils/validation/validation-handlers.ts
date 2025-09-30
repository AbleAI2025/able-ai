import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { parseExperienceToNumeric } from '@/lib/utils/experienceParsing';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

export interface ValidationResult {
  sufficient: boolean;
  clarificationPrompt?: string;
  sanitized?: string | any;
  naturalSummary?: string;
  extractedData?: any;
}

export interface AIValidationResponse {
  isAppropriate: boolean;
  isWorkerRelated: boolean;
  isSufficient: boolean;
  clarificationPrompt: string;
  sanitizedValue: string;
  naturalSummary: string;
  extractedData: string;
}

/**
 * AI-powered validation function using Gemini
 */
export async function simpleAICheck(
  field: string, 
  value: any, 
  type: string, 
  currentQuestion?: string,
  ai?: any
): Promise<ValidationResult> {
  if (!value) {
    return { 
      sufficient: false, 
      clarificationPrompt: 'Please provide some information so I can help you create your worker profile!' 
    };
  }

  const trimmedValue = String(value).trim();
  
  // Use AI for all validation
  try {
    const validationSchema = TypedSchema.object({
      properties: {
        isAppropriate: TypedSchema.boolean(),
        isWorkerRelated: TypedSchema.boolean(),
        isSufficient: TypedSchema.boolean(),
        clarificationPrompt: TypedSchema.string(),
        sanitizedValue: TypedSchema.string(),
        naturalSummary: TypedSchema.string(),
        extractedData: TypedSchema.string(),
      },
    });

    const prompt = `You are Able, a WORKER PROFILE ASSISTANT. Your ONLY job is to help users create their worker profiles on a gig platform. You are NOT a general assistant, therapist, or friend. You ONLY help with worker profile creation.

CRITICAL: This is a WORKER PROFILE CREATION FLOW. The user is creating their profile to showcase their skills and find gig work. They are the WORKER/EMPLOYEE creating their profile. You are helping them create a worker profile.

IMPORTANT: Be consistent and intelligent with validation. Accept reasonable inputs for each field type. For experience, accept numbers and text. For hourly rates, accept positive numbers. For skills, accept any professional skill name.

CRITICAL FOR ALL FIELDS: When validating any field, treat it as completely independent. Do NOT reference or compare it to any existing skills, job titles, or previous context. Each field should be validated on its own merit based on the current question being asked.

CRITICAL FOR SKILLS: When validating the 'skills' field, this serves as the job title. Treat it as completely independent. Do NOT reference or compare it to any existing skills mentioned in the context. Each skill should be validated on its own merit.

CURRENT FIELD: ${field}
CURRENT TYPE: ${type}
CURRENT QUESTION: ${currentQuestion || 'Not specified'}
USER INPUT: "${trimmedValue}"

VALIDATION RULES:
- For skills: Accept any professional skill name, job title, or service description
- For experience: Accept numbers (years), text descriptions, or combinations
- For hourly rates: Accept positive numbers (minimum £12.21 for London)
- For qualifications: Accept any professional qualifications, certifications, or education
- For equipment: Accept any work-related equipment or tools
- For dates: Accept any valid date format
- For location fields: Accept coordinates, addresses, venue names, or any location information
- For time fields: Accept single times (12:00, 2:30 PM) or time ranges (12:00-14:30, 12:00 PM - 2:30 PM)
- For "about" field (bio): DO NOT clean or rewrite the content. Only check for appropriateness and sufficiency. Keep the original text as-is.

If validation passes, respond with:
- isAppropriate: true
- isWorkerRelated: true
- isSufficient: true
- clarificationPrompt: ""
- sanitizedValue: string (for "about" field, use the EXACT original input without any changes; for other fields, provide a cleaned version)
- naturalSummary: string (for "about" field, just say "Bio provided" or similar; for other fields, provide a natural summary like "You have relevant qualifications and certifications")
- extractedData: string (JSON string of any structured data extracted from the input)

If validation fails, respond with:
- isAppropriate: boolean
- isWorkerRelated: boolean
- isSufficient: boolean
- clarificationPrompt: string (provide a friendly, contextual response that references what they've already shared and guides them naturally)
  - For hourlyRate below £12.21: "I understand you want to keep costs down, but we need to ensure all gigs meet the London minimum wage of £12.21 per hour. This is a legal requirement to protect workers. Could you please increase the hourly rate to at least £12.21?"
- sanitizedValue: string
- naturalSummary: string (a brief summary of what was provided, even if insufficient)
- extractedData: string (JSON string of any structured data extracted from the input)

WORKER PROFILE CONTEXT: Remember, this user is creating their worker profile to find gig work. They are the worker/employee. Keep responses focused on worker profile creation only.

Respond with JSON only:`;

    if (!ai) {
      console.error('AI service not available');
      return { sufficient: true, sanitized: trimmedValue };
    }

    const result = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt,
        responseSchema: validationSchema,
        isStream: false,
      },
      ai,
      "gemini-2.5-flash-preview-05-20"
    );

    if (result.ok) {
      const validation = result.data as AIValidationResponse;
      
      // Fallback validation for hourly rate - if AI incorrectly rejects a valid rate
      if (field === 'hourlyRate' && !validation.isSufficient) {
        const rate = parseFloat(trimmedValue);
        if (!isNaN(rate) && rate >= VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
          return {
            sufficient: true,
            sanitized: rate.toString(),
            naturalSummary: `Hourly rate set to £${rate}`,
            extractedData: JSON.stringify({ hourlyRate: rate })
          };
        }
      }

      // Fallback validation for experience - if AI incorrectly rejects valid experience
      if (field === 'experience' && !validation.isSufficient) {
        const experienceData = parseExperienceToNumeric(trimmedValue);
        if (experienceData.years > 0 || experienceData.months > 0) {
          return {
            sufficient: true,
            sanitized: trimmedValue,
            naturalSummary: `Experience: ${experienceData.years} years, ${experienceData.months} months`,
            extractedData: JSON.stringify(experienceData)
          };
        }
      }

      return {
        sufficient: validation.isSufficient,
        clarificationPrompt: validation.clarificationPrompt,
        sanitized: validation.sanitizedValue,
        naturalSummary: validation.naturalSummary,
        extractedData: validation.extractedData ? JSON.parse(validation.extractedData) : undefined
      };
    } else {
      console.error('AI validation failed:', result.error);
      return { sufficient: true, sanitized: trimmedValue };
    }
  } catch (error) {
    console.error('Validation error:', error);
    return { sufficient: true, sanitized: trimmedValue };
  }
}

/**
 * Enhanced validation with better error handling
 */
export async function enhancedValidation(
  field: string, 
  value: unknown, 
  type: string,
  ai?: any
): Promise<ValidationResult> {
  if (!value) {
    return { 
      sufficient: false, 
      clarificationPrompt: 'Please provide some information so I can help you create the perfect worker profile!'
    };
  }

  const trimmedValue = String(value).trim();
  
  // Use AI for validation
  try {
    if (!ai) {
      console.error('AI service not available');
      return { sufficient: true, sanitized: trimmedValue };
    }

    // Simplified validation logic - can be expanded later
    return {
      sufficient: true,
      sanitized: trimmedValue,
      naturalSummary: `You provided: ${trimmedValue}`,
      extractedData: trimmedValue
    };
  } catch (error) {
    console.error('Validation error:', error);
    return { sufficient: true, sanitized: trimmedValue };
  }
}

/**
 * Validate user input with context
 */
export function validateUserInputWithContext(
  input: string,
  fieldType: string,
  context?: any
): { isValid: boolean; error?: string; sanitized?: string } {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, error: 'Please provide a value' };
  }

  // Basic validation based on field type
  switch (fieldType) {
    case 'hourlyRate':
      const rate = parseFloat(trimmed);
        if (isNaN(rate) || rate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
          return { 
            isValid: false, 
            error: `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}` 
          };
        }
      return { isValid: true, sanitized: rate.toString() };
    
    case 'experience':
      const experienceData = parseExperienceToNumeric(trimmed);
      if (experienceData.years === 0 && experienceData.months === 0) {
        return { isValid: false, error: 'Please provide valid experience information' };
      }
      return { isValid: true, sanitized: trimmed };
    
    default:
      return { isValid: true, sanitized: trimmed };
  }
}
