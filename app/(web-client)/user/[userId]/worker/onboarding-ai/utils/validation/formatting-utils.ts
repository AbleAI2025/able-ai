/**
 * Format date for display
 */
export function formatDateForDisplay(dateValue: unknown): string {
  if (!dateValue) return 'Not specified';
  
  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      date = new Date(dateValue);
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return 'Invalid date';
    }
    
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Format summary value for display
 */
export function formatSummaryValue(value: unknown, field?: string): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified';
  }
  
  if (typeof value === 'string') {
    return value.trim();
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    
    // Handle equipment arrays
    if (field === 'equipment' && value.every(item => typeof item === 'object' && item !== null && 'name' in item)) {
      return value.map((item: any) => item.name).join(', ');
    }
    
    return value.join(', ');
  }
  
  if (typeof value === 'object' && value !== null) {
    // Handle availability objects
    if (field === 'availability' && 'days' in value) {
      const availability = value as any;
      if (availability.days && availability.days.length > 0) {
        return `${availability.days.join(', ')} from ${availability.startTime} to ${availability.endTime}`;
      }
      return 'Not specified';
    }
    
    // Handle location objects
    if (field === 'location' && 'address' in value) {
      return (value as any).address || 'Location specified';
    }
    
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Generate random code
 */
export function generateRandomCode(length = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Build recommendation link
 */
export function buildRecommendationLink(workerProfileId: string | null): string {
  if (!workerProfileId) {
    return 'https://able-ai.com/recommendation';
  }
  return `https://able-ai.com/recommendation/${workerProfileId}`;
}
