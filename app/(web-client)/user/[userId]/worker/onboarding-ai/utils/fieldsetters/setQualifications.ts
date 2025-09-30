/**
 * setQualifications.ts
 * 
 * Field setter for qualifications validation.
 * Handles qualification text validation and processing.
 */

import { checkInappropriateContent, checkOffTopicResponse } from '../filters';
import { setSupportValidation } from './setSupportValidation';

export function setQualifications(value: string): {
  ok: boolean;
  error?: string;
  qualifications?: string;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
  needsSupport?: boolean;
  supportMessage?: string;
  escalationTrigger?: any;
} {
  const trimmed = (value || '').trim();
  
  // Check for support/escalation needs first
  const supportValidation = setSupportValidation(trimmed, {
    fieldType: 'qualifications',
    currentStep: 'qualifications_validation'
  });
  
  if (supportValidation.needsSupport) {
    return {
      ok: false,
      error: supportValidation.supportMessage || 'Support assistance needed',
      needsSupport: true,
      supportMessage: supportValidation.supportMessage,
      escalationTrigger: supportValidation.escalationTrigger
    };
  }
  
  // Check for skip/none responses first
  const skipPatterns = [
    'none', 'n/a', 'na', 'skip', 'no qualifications', 'no certs', 'no certifications',
    'don\'t have any', 'don\'t have', 'no formal', 'no official', 'nothing',
    'not applicable', 'not relevant', 'no training', 'no education'
  ];
  
  const isSkipResponse = skipPatterns.some(pattern => 
    trimmed.toLowerCase().includes(pattern.toLowerCase())
  );
  
  if (isSkipResponse) {
    return { 
      ok: true, 
      qualifications: 'No formal qualifications',
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Basic validation for non-skip responses
  if (!trimmed) {
    return { ok: false, error: 'Please enter your qualifications or say "none" if you don\'t have any' };
  }
  
  if (trimmed.length < 10) {
    return { ok: false, error: 'Qualifications must be at least 10 characters long, or say "none" if you don\'t have any' };
  }
  
  if (trimmed.length > 1000) {
    return { ok: false, error: 'Qualifications must be less than 1000 characters' };
  }
  
  // Check for inappropriate content
  const inappropriateCheck = checkInappropriateContent(trimmed);
  if (!inappropriateCheck.isAppropriate) {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please keep your qualifications professional and appropriate',
      isAppropriate: false
    };
  }
  
  // Check if it's worker-related
  const offTopicCheck = checkOffTopicResponse({
    currentStep: 'qualifications',
    currentField: 'qualifications',
    currentPrompt: 'Please provide your qualifications, certifications, or relevant training.',
    previousMessages: [] // Not available in this context, but kept for type compatibility
  }, trimmed);
  
  if (!offTopicCheck.isRelevant) {
    return { 
      ok: false, 
      error: offTopicCheck.reason || 'Please provide information relevant to your professional qualifications',
      isWorkerRelated: false
    };
  }
  
  // Normalize qualifications text
  const normalizedQualifications = trimmed
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
  
  return { 
    ok: true, 
    qualifications: normalizedQualifications,
    isAppropriate: true,
    isWorkerRelated: true
  };
}
