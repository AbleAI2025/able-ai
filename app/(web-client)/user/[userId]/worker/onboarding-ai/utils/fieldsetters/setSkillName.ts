/**
 * setSkillName.ts
 * 
 * Modularized function for setting and validating primary skill name.
 * Provides comprehensive validation, content filtering, and
 * structured data formatting for skill information.
 */

import { validateUserInput, type ValidationContext } from '../validation/unified-validation';
import { Schema } from '@firebase/ai';

/**
 * Set and validate primary skill name
 * Accepts skill input, validates against inappropriate/off-topic content,
 * and returns structured format
 */
export async function setSkillName(value: string, aiService?: any): Promise<{ 
  ok: boolean; 
  error?: string; 
  skillName?: string;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
}> {
  const trimmed = (value || '').trim();
  
  // Basic validation
  if (!trimmed) {
    return { ok: false, error: 'Please enter a skill name' };
  }
  
  if (trimmed.length < 2) {
    return { ok: false, error: 'Skill name must be at least 2 characters long' };
  }
  
  if (trimmed.length > 100) {
    return { ok: false, error: 'Skill name must be less than 100 characters' };
  }
  
  // Use unified validation
  const context: ValidationContext = {
    currentStep: 'skills',
    currentField: 'skills',
    conversationLength: 0,
    retryCount: 0,
    userRole: 'worker',
    previousMessages: []
  };
  
  const validation = await validateUserInput(trimmed, context, aiService);
  
  if (!validation.isValid) {
    return { 
      ok: false, 
      error: validation.reason,
      isAppropriate: !validation.isInappropriate,
      isWorkerRelated: !validation.isHelpRequest
    };
  }
  
  // Use AI to extract and clean the profession/skill name
  let skillName = trimmed;
  
  if (aiService) {
    try {
      const { geminiAIAgent } = await import('@/lib/firebase/ai');
      
      const response = await geminiAIAgent(
        "gemini-2.0-flash",
        {
          prompt: `Extract the profession or job title from this user input. Return only the clean profession name as a single word or short phrase.

Examples:
- "I am a baker" → "Baker"
- "I work as a mechanic" → "Mechanic" 
- "I Am A Machinist" → "Machinist"
- "Software Engineer" → "Software Engineer"
- "I'm a teacher" → "Teacher"
- "Chef" → "Chef"

User input: "${trimmed}"

Return only the clean profession name:`,
          responseSchema: Schema.object({
            properties: {
              profession: Schema.string()
            },
            required: ["profession"]
          }),
          isStream: false,
        },
        aiService
      );
      
      if (response.ok && response.data) {
        const data = response.data as { profession: string };
        skillName = data.profession;
        console.log('🔍 AI extracted skill name:', skillName);
      } else {
        console.log('🔍 AI extraction failed, using fallback');
        // Fallback to basic normalization
        skillName = trimmed
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    } catch (error) {
      console.error('AI skill name extraction failed:', error);
      // Fallback to basic normalization
      skillName = trimmed
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  } else {
    console.log('🔍 No AI service available, using fallback normalization');
    // Fallback to basic normalization if no AI service
    skillName = trimmed
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  console.log('🔍 Final skill name:', skillName);
  
  return { 
    ok: true, 
    skillName,
    isAppropriate: true,
    isWorkerRelated: true
  };
}
