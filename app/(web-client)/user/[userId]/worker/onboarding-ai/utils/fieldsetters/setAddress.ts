/**
 * setAddress.ts
 * 
 * Modularized function for setting and validating user address/location.
 * Provides comprehensive validation, content filtering, and
 * structured data formatting for location information.
 */

import { checkInappropriateContent, checkOffTopicResponse } from '../filters';

/**
 * Set and validate user address/location
 * Captures user's address/location, allows structured storage,
 * and returns normalized location data
 */
export function setAddress(value: any): {
  ok: boolean;
  error?: string;
  address?: { city?: string; province?: string; country?: string };
  location?: { lat: number; lng: number; formatted_address?: string };
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
} {
  if (!value) {
    return { ok: false, error: 'Please provide your location or address' };
  }

  // If coordinate object (from location picker)
  if (typeof value === 'object' && 'lat' in value && 'lng' in value) {
    const loc = value as { lat: number; lng: number; formatted_address?: string };
    
    // Validate coordinates
    if (isNaN(loc.lat) || isNaN(loc.lng)) {
      return { ok: false, error: 'Invalid location coordinates' };
    }
    
    if (loc.lat < -90 || loc.lat > 90 || loc.lng < -180 || loc.lng > 180) {
      return { ok: false, error: 'Location coordinates are out of valid range' };
    }
    
    return { 
      ok: true, 
      location: loc,
      isAppropriate: true,
      isWorkerRelated: true
    };
  }

  // If string address
  const text = String(value).trim();
  if (!text) {
    return { ok: false, error: 'Please provide your address' };
  }
  
  if (text.length < 3) {
    return { ok: false, error: 'Please provide a more complete address' };
  }
  
  // Check for inappropriate content
  const inappropriateCheck = checkInappropriateContent(text);
  if (!inappropriateCheck.isAppropriate) {
    return { 
      ok: false, 
      error: inappropriateCheck.message || 'Please provide a professional address without inappropriate language',
      isAppropriate: false
    };
  }
  
  // Check if it's location-related
  const offTopicCheck = checkOffTopicResponse({
    currentStep: 'location',
    currentField: 'location',
    currentPrompt: 'Where are you based? This helps us find gigs near you!',
    previousMessages: []
  }, text);
  
  if (!offTopicCheck.isRelevant) {
    return { 
      ok: false, 
      error: 'Please provide a valid address or location (e.g., street, city, postcode)',
      isWorkerRelated: false
    };
  }
  
  // Parse address components
  const parts = text.split(',').map(p => p.trim()).filter(Boolean);
  const [city, province, country] = [parts[0], parts[1], parts[parts.length - 1]];
  
  return { 
    ok: true, 
    address: { city, province, country },
    isAppropriate: true,
    isWorkerRelated: true
  };
}
