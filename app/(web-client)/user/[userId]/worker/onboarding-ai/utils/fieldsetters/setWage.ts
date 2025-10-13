/**
 * setWage.ts
 * 
 * Modularized function for setting and validating wage expectations.
 * Provides comprehensive validation, content filtering, and
 * structured data formatting for wage information.
 */

import { VALIDATION_CONSTANTS } from '@/app/constants/validation';
import { checkInappropriateContent, checkOffTopicResponse } from '../filters';

export type WageUnit = 'hour' | 'day' | 'week';

/**
 * Set and validate wage expectations
 * Accepts wage input (hourly/daily/weekly), normalizes to numeric + unit,
 * and validates against minimum wage and reasonable limits
 */
export function setWage(value: string): {
  ok: boolean;
  error?: string;
  wage?: { amount: number; unit: WageUnit };
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
} {
  const trimmed = (value || '').toString().trim().toLowerCase();
  
  // Basic validation
  if (!trimmed) {
    return { ok: false, error: 'Please enter your preferred rate' };
  }
  
  // Check for inappropriate content
  const inappropriateCheck = checkInappropriateContent(trimmed);
  if (!inappropriateCheck.isAppropriate) {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please provide a professional rate without inappropriate language',
      isAppropriate: false
    };
  }
  
  // Check if it's work-related
  // Special case: pure numbers are always considered work-related for wage fields
  const isPureNumber = /^\d+(\.\d+)?$/.test(trimmed);
  
  if (!isPureNumber) {
    const offTopicCheck = checkOffTopicResponse({
      currentStep: 'wage',
      currentField: 'hourlyRate',
      currentPrompt: 'What\'s your preferred hourly rate?',
      previousMessages: []
    }, trimmed);
    
    if (!offTopicCheck.isRelevant) {
      return { 
        ok: false, 
        error: 'Please provide your hourly rate (e.g., £15/hour, £20 per hour)',
        isWorkerRelated: false
      };
    }
  }

  // Extract number with better regex to handle various formats including decimals
  const numMatch = trimmed.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) {
    return { ok: false, error: 'Please enter a valid number for your hourly rate (e.g., £15, 20/hour, £25 per hour, 15.50, £12.50 per hour)' };
  }
  
  const amount = parseFloat(numMatch[1]);
  
  // Validate amount is reasonable
  if (isNaN(amount) || amount <= 0) {
    return { ok: false, error: 'Please enter a positive number for your rate' };
  }

  // Determine unit with improved detection
  let unit: WageUnit = 'hour'; // Default to hourly
  
  // For hourly rate field, only accept hourly rates
  if (/week|wk|w\b|weekly/.test(trimmed)) {
    return { 
      ok: false, 
      error: 'Please enter your hourly rate only (e.g., £15/hour, £20 per hour). Daily and weekly rates are not accepted for this field.' 
    };
  }
  
  if (/day|daily|d\b|per\s*day/.test(trimmed)) {
    return { 
      ok: false, 
      error: 'Please enter your hourly rate only (e.g., £15/hour, £20 per hour). Daily rates are not accepted for this field.' 
    };
  }
  
  if (/hour|hr|h\b|per\s*hour|ph|p\.h\./.test(trimmed)) {
    unit = 'hour';
  }

  // Enhanced validation with better error messages
  if (unit === 'hour') {
    if (amount < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      return { 
        ok: false, 
        error: `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE} to comply with minimum wage laws. This protects both you and your clients.` 
      };
    }
    if (amount > 500) {
      return { 
        ok: false, 
        error: 'Hourly rate seems unusually high. Please enter a reasonable amount (≤ £500/hour). If this is correct, please contact support.' 
      };
    }
  }
  
  // Only hourly rates are accepted for this field

  return { 
    ok: true, 
    wage: { amount, unit },
    isAppropriate: true,
    isWorkerRelated: true
  };
}
