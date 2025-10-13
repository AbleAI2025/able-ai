/**
 * setVideoIntro.ts
 * 
 * Field setter for video introduction validation.
 * Handles video upload validation and processing.
 */

import { checkInappropriateContent, checkOffTopicResponse } from '../filters';
import { setSupportValidation } from './setSupportValidation';

export function setVideoIntro(value: any): {
  ok: boolean;
  error?: string;
  videoIntro?: string;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
  needsSupport?: boolean;
  supportMessage?: string;
  escalationTrigger?: any;
} {
  // Handle different input types
  if (!value) {
    return { ok: false, error: 'Please provide a video introduction' };
  }
  
  // If it's a string (URL), validate it
  if (typeof value === 'string') {
    const trimmed = value.trim();
    
    if (!trimmed) {
      return { ok: false, error: 'Please provide a video introduction' };
    }
    
    // Check if it's a valid URL
    try {
      new URL(trimmed);
    } catch {
      return { ok: false, error: 'Please provide a valid video URL' };
    }
    
    return { 
      ok: true, 
      videoIntro: trimmed,
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // If it's a File or Blob, it's valid
  if (value instanceof File || value instanceof Blob) {
    return { 
      ok: true, 
      videoIntro: 'Video file provided',
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // If it's an object with video properties
  if (typeof value === 'object' && value !== null) {
    if (value.url || value.downloadURL) {
      return { 
        ok: true, 
        videoIntro: value.url || value.downloadURL,
        isAppropriate: true,
        isWorkerRelated: true
      };
    }
  }
  
  return { ok: false, error: 'Please provide a valid video introduction' };
}
