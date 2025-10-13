/**
 * Check if a date value is valid
 */
export function isValidDate(dateValue: unknown): boolean {
  if (!dateValue) return false;
  
  if (typeof dateValue === 'string') {
    const date = new Date(dateValue);
    return !isNaN(date.getTime());
  }
  
  if (dateValue instanceof Date) {
    return !isNaN(dateValue.getTime());
  }
  
  return false;
}

/**
 * Check if a coordinate value is valid
 */
export function isValidCoordinate(value: unknown): value is { lat: number; lng: number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'lat' in value &&
    'lng' in value &&
    typeof (value as any).lat === 'number' &&
    typeof (value as any).lng === 'number' &&
    !isNaN((value as any).lat) &&
    !isNaN((value as any).lng)
  );
}

/**
 * Check if content is inappropriate
 */
export function checkInappropriateContent(input: string): {
  isAppropriate: boolean;
  isWorkerRelated: boolean;
  isSufficient: boolean;
  clarificationPrompt: string;
  sanitizedValue: string;
  naturalSummary: string;
  extractedData: string;
} {
  const lowerInput = input.toLowerCase().trim();
  
  // Check for inappropriate content
  const inappropriateWords = ['hate', 'stupid', 'dumb', 'suck', 'terrible', 'awful'];
  const isAppropriate = !inappropriateWords.some(word => lowerInput.includes(word));
  
  // Check if it's worker-related
  const workerKeywords = ['work', 'job', 'skill', 'experience', 'professional', 'career', 'shift', 'duty', 'task', 'responsibility'];
  const isWorkerRelated = workerKeywords.some(keyword => lowerInput.includes(keyword));
  
  // Check if it's sufficient (at least 10 characters)
  const isSufficient = input.trim().length >= 10;
  
  // Generate appropriate responses
  let clarificationPrompt = '';
  if (!isAppropriate) {
    clarificationPrompt = 'Please provide a professional response without inappropriate language.';
  } else if (!isWorkerRelated) {
    clarificationPrompt = 'Please focus on your work experience, skills, or professional background.';
  } else if (!isSufficient) {
    clarificationPrompt = 'Please provide more detail about your experience.';
  }
  
  return {
    isAppropriate,
    isWorkerRelated,
    isSufficient,
    clarificationPrompt,
    sanitizedValue: input.trim(),
    naturalSummary: `You mentioned: ${input.trim()}`,
    extractedData: JSON.stringify({ content: input.trim() })
  };
}
