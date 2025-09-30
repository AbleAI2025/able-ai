/**
 * setBio.ts
 * 
 * Modularized function for setting and validating bio/about field.
 * Provides comprehensive validation, content filtering, and
 * structured data formatting for user bio information.
 */

import { checkInappropriateContent, checkOffTopicResponse } from '../filters';
import { setSupportValidation } from './setSupportValidation';

/**
 * Set and validate bio/about field
 * Accepts bio input, validates against inappropriate/off-topic content,
 * and returns structured format
 */
export function setBio(value: string, context?: {
  retryCount?: number;
  conversationLength?: number;
  userRole?: string;
}): { 
  ok: boolean; 
  error?: string; 
  bio?: string;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
  needsSupport?: boolean;
  supportMessage?: string;
  escalationTrigger?: any;
} {
  const trimmed = (value || '').trim();
  
  // Check for support/escalation needs first
  const supportValidation = setSupportValidation(trimmed, {
    ...context,
    fieldType: 'bio',
    currentStep: 'bio_validation'
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
  
  // Basic validation
  if (!trimmed) {
    return { ok: false, error: 'Please enter your bio' };
  }
  
  if (trimmed.length < 10) {
    return { ok: false, error: 'Bio must be at least 10 characters long' };
  }
  
  if (trimmed.length > 1000) {
    return { ok: false, error: 'Bio must be less than 1000 characters' };
  }
  
  // For bio field, be very lenient - only check for extreme inappropriate content
  // Don't reject based on off-topic content, just clean it up
  const inappropriateCheck = checkInappropriateContent(trimmed);
  
  // Only reject if it's extremely inappropriate (not just casual language)
  if (!inappropriateCheck.isAppropriate && inappropriateCheck.severity === 'critical') {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please keep your bio professional and appropriate',
      isAppropriate: false
    };
  }
  
  // Don't check for off-topic content - bio should be very lenient
  // Accept any content and let AI clean it up
  
  // Normalize bio text - basic cleanup
  const normalizedBio = trimmed
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n\n') // Normalize paragraph breaks
    .trim();
  
  return { 
    ok: true, 
    bio: normalizedBio,
    isAppropriate: true,
    isWorkerRelated: true
  };
}
