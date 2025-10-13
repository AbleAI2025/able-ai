/**
 * compatibility-layer.ts
 * 
 * Compatibility layer to maintain backward compatibility with existing fieldsetters
 * while using the unified validation system internally.
 */

import { validateUserInput, type ValidationContext } from './unified-validation';

/**
 * Legacy inappropriate content check (for backward compatibility)
 */
export function checkInappropriateContent(content: string): {
  isAppropriate: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message?: string;
  categories: string[];
} {
  const lowerContent = content.toLowerCase();
  
  // Define inappropriate content categories with severity levels
  const inappropriatePatterns = {
    profanity: {
      severity: 'medium' as const,
      patterns: ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'crap', 'piss', 'hell', 'bloody', 'bugger', 'sod', 'twat', 'wanker']
    },
    violence: {
      severity: 'high' as const,
      patterns: ['kill', 'murder', 'violence', 'attack', 'hurt', 'harm', 'fight', 'beat', 'stab', 'shoot', 'bomb', 'threat', 'danger']
    },
    sexual: {
      severity: 'high' as const,
      patterns: ['sex', 'porn', 'nude', 'naked', 'sexual', 'intimate', 'adult', 'fetish', 'kink', 'orgasm', 'masturbat']
    },
    selfHarm: {
      severity: 'critical' as const,
      patterns: ['suicide', 'kill myself', 'end my life', 'self harm', 'cut myself', 'hurt myself', 'depression', 'anxiety', 'mental health']
    },
    substances: {
      severity: 'medium' as const,
      patterns: ['drug', 'alcohol', 'drunk', 'high', 'cocaine', 'heroin', 'marijuana', 'weed', 'cannabis', 'alcohol', 'beer', 'wine', 'drinking']
    },
    discrimination: {
      severity: 'critical' as const,
      patterns: ['hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'discriminat', 'prejudice', 'bias', 'stereotype', 'offensive']
    }
  };
  
  const detectedCategories: string[] = [];
  let maxSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check each category
  for (const [category, config] of Object.entries(inappropriatePatterns)) {
    const hasMatch = config.patterns.some(pattern => lowerContent.includes(pattern));
    if (hasMatch) {
      detectedCategories.push(category);
      if (config.severity === 'critical' || 
          (config.severity === 'high' && maxSeverity !== 'critical') ||
          (config.severity === 'medium' && maxSeverity === 'low')) {
        maxSeverity = config.severity;
      }
    }
  }
  
  if (detectedCategories.length === 0) {
    return {
      isAppropriate: true,
      severity: 'low',
      categories: []
    };
  }
  
  // Generate appropriate error message based on severity
  let message = '';
  switch (maxSeverity) {
    case 'critical':
      message = 'This content contains inappropriate material that violates our community guidelines. Please provide professional information instead.';
      break;
    case 'high':
      message = 'Please keep your response professional and appropriate for a work environment.';
      break;
    case 'medium':
      message = 'Please use professional language when describing your skills and experience.';
      break;
    default:
      message = 'Please provide a more professional response.';
  }
  
  return {
    isAppropriate: false,
    severity: maxSeverity,
    message,
    categories: detectedCategories
  };
}

/**
 * Legacy off-topic response check (for backward compatibility)
 */
export function checkOffTopicResponse(context: {
  currentStep: string;
  currentField: string;
  currentPrompt: string;
  previousMessages: string[];
}, userResponse: string): {
  isRelevant: boolean;
  confidence: number;
  reason?: string;
  suggestedPrompt?: string;
} {
  const lowerResponse = userResponse.toLowerCase();
  
  // Define field-specific relevance keywords
  const fieldKeywords = {
    bio: ['about', 'myself', 'background', 'story', 'professional', 'experience', 'skills', 'passion', 'career'],
    skills: ['skill', 'ability', 'capability', 'expertise', 'proficient', 'experienced', 'work', 'service', 'job'],
    experience: ['year', 'month', 'experience', 'work', 'job', 'career', 'professional', 'beginner', 'intermediate', 'advanced', 'senior'],
    qualifications: ['degree', 'diploma', 'certificate', 'certification', 'qualification', 'license', 'education', 'training', 'course'],
    location: ['address', 'location', 'city', 'town', 'area', 'postcode', 'zip', 'street', 'road', 'based', 'live'],
    availability: ['available', 'schedule', 'time', 'day', 'week', 'hour', 'work', 'free', 'busy', 'calendar'],
    equipment: ['tool', 'equipment', 'machine', 'device', 'computer', 'laptop', 'phone', 'camera', 'software', 'hardware'],
    wage: ['rate', 'wage', 'salary', 'pay', 'price', 'cost', 'hour', 'day', 'week', 'pound', 'dollar', 'money'],
    video: ['video', 'record', 'introduction', 'introduce', 'myself', 'camera', 'film', 'record']
  };
  
  const relevantKeywords = fieldKeywords[context.currentField as keyof typeof fieldKeywords] || [];
  const hasRelevantKeywords = relevantKeywords.some(keyword => lowerResponse.includes(keyword));
  
  // Check for off-topic responses
  const offTopicPatterns = [
    'i don\'t know', 'i don\'t understand', 'what do you mean', 'can you explain',
    'i\'m confused', 'i need help', 'i don\'t have', 'i can\'t', 'i won\'t',
    'this is stupid', 'this is boring', 'i hate this', 'i don\'t want to',
    'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
    'thank you', 'thanks', 'please', 'sorry', 'excuse me'
  ];
  
  const isOffTopic = offTopicPatterns.some(pattern => lowerResponse.includes(pattern));
  
  // Calculate relevance confidence
  let confidence = 0.5;
  if (hasRelevantKeywords) confidence += 0.3;
  if (isOffTopic) confidence -= 0.4;
  if (userResponse.trim().length < 5) confidence -= 0.2;
  if (userResponse.trim().length > 500) confidence -= 0.1;
  
  // Special handling for numerical values in experience field
  if (context.currentField === 'experience') {
    const isNumeric = /^\d+/.test(userResponse.trim()) || /^\d+\s*(years?|yrs?|months?)/i.test(userResponse.trim());
    if (isNumeric) {
      confidence = 0.8; // High confidence for numerical experience values
    }
  }
  
  confidence = Math.max(0, Math.min(1, confidence));
  
  // Be more lenient for equipment and experience fields
  const confidenceThreshold = context.currentField === 'equipment' ? 0.3 : 
                            context.currentField === 'experience' ? 0.4 : 0.6;
  
  if (confidence < confidenceThreshold) {
    return {
      isRelevant: false,
      confidence,
      reason: 'Response doesn\'t seem to relate to the current question',
      suggestedPrompt: context.currentPrompt
    };
  }
  
  return {
    isRelevant: true,
    confidence,
    reason: 'Response appears relevant to the current field'
  };
}

/**
 * Legacy content validation with AI (for backward compatibility)
 */
export async function validateContentWithAI(
  content: string,
  fieldType: string,
  aiService?: any
): Promise<{
  isValid: boolean;
  confidence: number;
  suggestions?: string[];
  sanitizedContent?: string;
}> {
  if (!aiService) {
    // Fallback to basic validation if AI service not available
    const inappropriateCheck = checkInappropriateContent(content);
    const offTopicCheck = checkOffTopicResponse({
      currentStep: fieldType,
      currentField: fieldType,
      currentPrompt: `Please provide information about your ${fieldType}.`,
      previousMessages: []
    }, content);
    
    return {
      isValid: inappropriateCheck.isAppropriate && offTopicCheck.isRelevant,
      confidence: offTopicCheck.confidence,
      suggestions: inappropriateCheck.isAppropriate ? [] : [inappropriateCheck.message || 'Please provide more appropriate content.']
    };
  }
  
  // Use unified validation
  const context: ValidationContext = {
    currentStep: fieldType,
    currentField: fieldType,
    conversationLength: 0,
    retryCount: 0,
    userRole: 'worker',
    previousMessages: []
  };
  
  const validation = await validateUserInput(content, context, aiService);
  
  return {
    isValid: validation.isValid,
    confidence: validation.confidence,
    suggestions: validation.isValid ? [] : [validation.reason],
    sanitizedContent: validation.sanitizedInput
  };
}
