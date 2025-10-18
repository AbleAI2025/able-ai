/**
 * hospitality-ai-utils.ts
 * 
 * Hospitality-specific AI utilities using Gemini 2.5 Flash.
 * Extends existing AI utilities with hospitality-specific functionality.
 */

import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { HOSPITALITY_PROMPTS } from './hospitality-prompts';

// Type assertion for Schema to resolve TypeScript errors
const TypedSchema = Schema as any;

export interface HospitalityFormData {
  mainSkill?: string;
  venueExperience?: string;
  qualifications?: string;
  specificSkills?: string;
  workTraits?: string;
  equipment?: any[];
  location?: { lat: number; lng: number } | string;
  availability?: any;
  hourlyRate?: number;
  videoIntro?: string;
  [key: string]: any;
}

/**
 * Generate hospitality-specific video script using Gemini 2.5 Flash
 */
export async function generateHospitalityVideoScript(
  formData: HospitalityFormData, 
  ai: any
): Promise<string> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.5-flash",
      {
        prompt: HOSPITALITY_PROMPTS.videoScript(formData),
        responseSchema: TypedSchema.object({
          properties: {
            script: TypedSchema.string(),
          },
          required: ['script']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data.script || getDefaultHospitalityScript(formData);
    }
  } catch (error) {
    console.error('Hospitality AI video script generation failed:', error);
  }

  return getDefaultHospitalityScript(formData);
}

/**
 * Generate hospitality-specific profile summary using Gemini 2.5 Flash
 */
export async function generateHospitalityProfileSummary(
  formData: HospitalityFormData, 
  ai: any
): Promise<string> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.5-flash",
      {
        prompt: HOSPITALITY_PROMPTS.profileSummary(formData),
        responseSchema: TypedSchema.object({
          properties: {
            summary: TypedSchema.string(),
          },
          required: ['summary']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return data.summary || getDefaultHospitalitySummary(formData);
    }
  } catch (error) {
    console.error('Hospitality AI profile summary generation failed:', error);
  }

  return getDefaultHospitalitySummary(formData);
}

/**
 * Analyze user intent for hospitality onboarding using Gemini 2.5 Flash
 */
export async function analyzeHospitalityIntent(
  userInput: string, 
  currentPhase: string, 
  ai: any
): Promise<{
  action: string;
  confidence: number;
  reason: string;
  suggestedResponse: string;
  extractedData?: any;
}> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.5-flash",
      {
        prompt: HOSPITALITY_PROMPTS.intentAnalysis(userInput, currentPhase),
        responseSchema: TypedSchema.object({
          properties: {
            action: TypedSchema.string(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string(),
            suggestedResponse: TypedSchema.string(),
            extractedData: TypedSchema.optional(TypedSchema.string())
          },
          required: ['action', 'confidence', 'reason', 'suggestedResponse']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return {
        action: data.action || 'continue',
        confidence: data.confidence || 0.5,
        reason: data.reason || 'No specific reason provided',
        suggestedResponse: data.suggestedResponse || 'Please provide more information.',
        extractedData: data.extractedData
      };
    }
  } catch (error) {
    console.error('Hospitality intent analysis failed:', error);
  }

  return {
    action: 'continue',
    confidence: 0.5,
    reason: 'Analysis failed, defaulting to continue',
    suggestedResponse: 'Please provide more information.'
  };
}

/**
 * Get default hospitality video script
 */
function getDefaultHospitalityScript(formData: HospitalityFormData): string {
  const skill = formData.mainSkill || 'hospitality professional';
  const experience = formData.venueExperience || 'various venues';
  const traits = formData.workTraits || 'professional and friendly';

  return `Hi! I'm [Your Name], and I'm a ${skill} with experience in ${experience}. 

I'm passionate about providing excellent customer service and creating memorable experiences for guests. My work style is ${traits}, and I thrive in fast-paced hospitality environments.

I'm excited about the opportunity to bring my skills and enthusiasm to your team. I'm reliable, adaptable, and always ready to go the extra mile for customers.

I'd love to discuss how I can contribute to your hospitality operations. Thank you for considering me!`;
}

/**
 * Get default hospitality profile summary
 */
function getDefaultHospitalitySummary(formData: HospitalityFormData): string {
  const skill = formData.mainSkill || 'hospitality professional';
  const experience = formData.venueExperience || 'various venues';
  const location = formData.location || 'UK';
  const rate = formData.hourlyRate || 'competitive';

  return `Experienced ${skill} with a strong background in ${experience}. Based in ${location}, I'm available for hospitality gigs at £${rate}/hour. I bring professionalism, customer service excellence, and a passion for creating great guest experiences.`;
}

/**
 * Validate hospitality field using AI
 */
export async function validateHospitalityFieldWithAI(
  fieldName: string,
  input: string,
  ai: any
): Promise<{
  isValid: boolean;
  confidence: number;
  reason: string;
  suggestedAction: string;
  sanitizedInput?: string;
}> {
  try {
    const result = await geminiAIAgent(
      "gemini-2.5-flash",
      {
        prompt: `Validate this hospitality onboarding input:

Field: ${fieldName}
Input: "${input}"

Check if the input is:
1. Relevant to UK hospitality
2. Appropriate and professional
3. Sufficiently detailed
4. Free from inappropriate content

Respond with JSON containing:
- isValid: boolean
- confidence: number (0-1)
- reason: string explanation
- suggestedAction: what to do next
- sanitizedInput: cleaned version if needed`,
        responseSchema: TypedSchema.object({
          properties: {
            isValid: TypedSchema.boolean(),
            confidence: TypedSchema.number(),
            reason: TypedSchema.string(),
            suggestedAction: TypedSchema.string(),
            sanitizedInput: TypedSchema.optional(TypedSchema.string())
          },
          required: ['isValid', 'confidence', 'reason', 'suggestedAction']
        }),
        isStream: false,
      },
      ai
    );

    if (result.ok) {
      const data = result.data as any;
      return {
        isValid: data.isValid || false,
        confidence: data.confidence || 0.5,
        reason: data.reason || 'Validation completed',
        suggestedAction: data.suggestedAction || 'Continue',
        sanitizedInput: data.sanitizedInput
      };
    }
  } catch (error) {
    console.error('Hospitality field validation failed:', error);
  }

  return {
    isValid: true,
    confidence: 0.5,
    reason: 'Validation failed, defaulting to valid',
    suggestedAction: 'Continue'
  };
}
