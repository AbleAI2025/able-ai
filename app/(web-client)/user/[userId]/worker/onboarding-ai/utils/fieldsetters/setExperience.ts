/**
 * setExperience.ts
 * 
 * Modularized function for setting and validating work experience.
 * Provides comprehensive validation, content filtering, and
 * structured data formatting for experience information.
 */

import { parseExperienceToNumeric } from '@/lib/utils/experienceParsing';
import { checkInappropriateContent, checkOffTopicResponse } from '../filters';

/**
 * Set and validate work experience
 * Accepts experience input (years/months or text like "beginner", "intermediate"),
 * normalizes to standard format, and returns structured data
 */
export function setExperience(value: string): {
  ok: boolean;
  error?: string;
  experienceText?: string;
  years?: number;
  months?: number;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
} {
  const trimmed = (value || '').trim();
  
  // Basic validation
  if (!trimmed) {
    return { ok: false, error: 'Please provide your experience level' };
  }
  
  if (trimmed.length < 2) {
    return { ok: false, error: 'Please provide more detail about your experience' };
  }
  
  // Check for inappropriate content
  const inappropriateCheck = checkInappropriateContent(trimmed);
  if (!inappropriateCheck.isAppropriate) {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please provide professional experience information without inappropriate language',
      isAppropriate: false
    };
  }
  
  // Check if it's work-related
  const offTopicCheck = checkOffTopicResponse({
    currentStep: 'experience',
    currentField: 'experience',
    currentPrompt: 'How many years of experience do you have in your field? You can enter a number (like \'5\' or \'3 years\') or a level (like \'beginner\', \'intermediate\', or \'senior\').',
    previousMessages: []
  }, trimmed);
  
  if (!offTopicCheck.isRelevant) {
    return { 
      ok: false, 
      error: 'Please provide information about your work experience or skill level',
      isWorkerRelated: false
    };
  }
  
  // Parse experience using existing utility
  const { years, months } = parseExperienceToNumeric(trimmed);
  
  // Normalize to standard format
  let experienceText = '';
  if (years && years > 0) {
    experienceText = `${years} year${years !== 1 ? 's' : ''}`;
  }
  if (months && months > 0) {
    experienceText += `${experienceText ? ' ' : ''}${months} month${months !== 1 ? 's' : ''}`;
  }
  
  // For descriptive levels (e.g., "beginner", "intermediate"), use the original text
  // Only use parsed years if user provided specific numbers
  const hasSpecificYears = /^\d+/.test(trimmed) || /years?|yrs?|months?/.test(trimmed);
  
  if (!hasSpecificYears) {
    // Normalize common experience levels but keep original format
    const levelMap: { [key: string]: string } = {
      'beginner': 'Beginner',
      'novice': 'Beginner', 
      'entry': 'Entry Level',
      'entry level': 'Entry Level',
      'intermediate': 'Intermediate',
      'mid': 'Intermediate',
      'mid level': 'Intermediate',
      'advanced': 'Advanced',
      'senior': 'Senior',
      'expert': 'Expert',
      'lead': 'Lead',
      'manager': 'Manager',
      'director': 'Director'
    };
    
    const normalizedLevel = levelMap[trimmed.toLowerCase()] || trimmed;
    experienceText = normalizedLevel;
  }
  
  return { 
    ok: true, 
    experienceText, 
    years: years || 0, 
    months: months || 0,
    isAppropriate: true,
    isWorkerRelated: true
  };
}
