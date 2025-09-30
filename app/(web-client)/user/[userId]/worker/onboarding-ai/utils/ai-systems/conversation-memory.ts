/**
 * conversation-memory.ts
 * 
 * Advanced conversation memory system for AI onboarding.
 * Captures and processes the full conversation history to provide
 * contextually aware responses without repetitive language.
 */

import { ChatStep } from '../step-management/step-flow';

export interface ConversationContext {
  userProfile: {
    skills?: string;
    experience?: string;
    qualifications?: string;
    about?: string;
    location?: string;
    availability?: string;
    equipment?: string;
    hourlyRate?: string;
  };
  conversationHistory: {
    botMessages: string[];
    userResponses: string[];
    fieldProgress: string[];
  };
  currentContext: {
    currentField: string;
    previousField?: string;
    nextField?: string;
    conversationStage: 'early' | 'middle' | 'late';
  };
}

/**
 * Build comprehensive conversation context from chat steps
 */
export function buildConversationContext(
  chatSteps: ChatStep[],
  formData: any,
  currentField: string
): ConversationContext {
  // Extract user profile information (excluding bio and experience for AI context)
  const userProfile = {
    skills: formData.skills,
    // experience: formData.experience, // Excluded from AI context to avoid redundancy
    qualifications: formData.qualifications,
    // about: formData.about, // Excluded from AI context
    location: formData.location,
    availability: formData.availability,
    equipment: formData.equipment,
    hourlyRate: formData.hourlyRate,
  };

  // Extract conversation history
  const botMessages: string[] = [];
  const userResponses: string[] = [];
  const fieldProgress: string[] = [];

  chatSteps.forEach((step, index) => {
    if (step.type === 'bot' && step.content) {
      botMessages.push(step.content);
    } else if (step.type === 'user' && step.content) {
      userResponses.push(step.content);
    } else if (step.type === 'input' && step.fieldName) {
      fieldProgress.push(step.fieldName);
    }
  });

  // Determine conversation stage
  const totalFields = ['about', 'skills', 'experience', 'qualifications', 'location', 'availability', 'equipment', 'hourlyRate', 'videoIntro'];
  const completedFields = Object.keys(formData).filter(key => formData[key] && formData[key].toString().trim() !== '');
  const progressRatio = completedFields.length / totalFields.length;
  
  let conversationStage: 'early' | 'middle' | 'late';
  if (progressRatio < 0.3) {
    conversationStage = 'early';
  } else if (progressRatio < 0.7) {
    conversationStage = 'middle';
  } else {
    conversationStage = 'late';
  }

  // Determine previous and next fields
  const currentFieldIndex = totalFields.indexOf(currentField);
  const previousField = currentFieldIndex > 0 ? totalFields[currentFieldIndex - 1] : undefined;
  const nextField = currentFieldIndex < totalFields.length - 1 ? totalFields[currentFieldIndex + 1] : undefined;

  return {
    userProfile,
    conversationHistory: {
      botMessages,
      userResponses,
      fieldProgress,
    },
    currentContext: {
      currentField,
      previousField,
      nextField,
      conversationStage,
    },
  };
}

/**
 * Generate context-aware prompt using full conversation memory
 */
export function generateMemoryAwarePrompt(
  fieldName: string,
  conversationContext: ConversationContext
): string {
  const { userProfile, conversationHistory, currentContext } = conversationContext;
  
  // Build a natural conversation summary
  const conversationSummary = buildConversationSummary(userProfile, conversationHistory);
  
  // Generate field-specific context
  const fieldContext = buildFieldContext(fieldName, userProfile, currentContext);
  
  // Create a natural, non-repetitive prompt
  return createNaturalPrompt(fieldName, conversationSummary, fieldContext, currentContext.conversationStage);
}

/**
 * Build a natural conversation summary
 */
function buildConversationSummary(
  userProfile: ConversationContext['userProfile'],
  conversationHistory: ConversationContext['conversationHistory']
): string {
  const summaryParts: string[] = [];
  
  // Keep it simple and conversational
  if (userProfile.skills) {
    return `Great! I can see you're a ${userProfile.skills}.`;
  }
  
  return 'Let\'s continue building your profile.';
}

/**
 * Build field-specific context
 */
function buildFieldContext(
  fieldName: string,
  userProfile: ConversationContext['userProfile'],
  currentContext: ConversationContext['currentContext']
): string {
  switch (fieldName) {
    case 'skills':
      return `Let's start by understanding your professional skills.`;
        
    case 'experience':
      return userProfile.skills 
        ? `How many years of experience do you have as a ${userProfile.skills}? You can enter a number (like '5' or '3 years') or a level (like 'beginner', 'intermediate', or 'senior').`
        : `How many years of experience do you have in your field? You can enter a number (like '5' or '3 years') or a level (like 'beginner', 'intermediate', or 'senior').`;
        
    case 'qualifications':
      return `What qualifications and certifications do you have? (Optional - you can skip this if you don't have any)`;
        
    case 'location':
      return userProfile.skills 
        ? `As a ${userProfile.skills}, where are you based for work?`
        : `Now let's talk about where you're based for work.`;
        
    case 'availability':
      return userProfile.skills 
        ? `Great! Now let's set up your availability schedule as a ${userProfile.skills}.`
        : `Great! Now let's set up your availability schedule.`;
        
    case 'equipment':
      return userProfile.skills 
        ? `What equipment do you have available for your ${userProfile.skills} work?`
        : `What equipment do you have available for your work?`;
        
    case 'hourlyRate':
      return userProfile.skills 
        ? `What's your preferred hourly rate as a ${userProfile.skills}?`
        : `What's your preferred hourly rate?`;
        
    case 'videoIntro':
      return userProfile.skills 
        ? `Finally, let's create a video introduction to help clients get to know you as a ${userProfile.skills}!`
        : `Finally, let's create a video introduction to help clients get to know you!`;
        
    default:
      return `Let's continue with your profile.`;
  }
}

/**
 * Create a natural, non-repetitive prompt
 */
function createNaturalPrompt(
  fieldName: string,
  conversationSummary: string,
  fieldContext: string,
  conversationStage: 'early' | 'middle' | 'late'
): string {
  // Check if the summary and field context are redundant
  const isRedundant = conversationSummary.includes('Great! I can see you\'re a') && 
                      fieldContext.includes('I can see from your background');
  
  if (isRedundant) {
    // Just return the field context to avoid redundancy
    return fieldContext;
  }
  
  // For other cases, provide proper contextual responses
  if (conversationSummary && conversationSummary !== 'Let\'s continue building your profile.') {
    // Use the conversation summary as the base and add the field context
    return `${conversationSummary} ${fieldContext}`;
  }
  
  // Fallback to just the field context
  return fieldContext;
}

/**
 * Check if we should avoid repetitive language
 */
export function shouldAvoidRepetition(
  conversationHistory: ConversationContext['conversationHistory'],
  currentField: string
): boolean {
  // Check if we've already mentioned the user's profession multiple times
  const recentBotMessages = conversationHistory.botMessages.slice(-3);
  const professionMentions = recentBotMessages.filter(msg => 
    msg.includes('you\'re a') || 
    msg.includes('you are a') || 
    msg.includes('as a') ||
    msg.includes('Now that I know')
  ).length;
  
  return professionMentions >= 2;
}

/**
 * Generate alternative phrasing to avoid repetition
 */
export function generateAlternativePhrasing(
  basePrompt: string,
  conversationContext: ConversationContext
): string {
  const { userProfile, currentContext } = conversationContext;
  
  // If we should avoid repetition, use more generic phrasing
  if (shouldAvoidRepetition(conversationContext.conversationHistory, currentContext.currentField)) {
    return basePrompt.replace(/you're a \w+/g, 'you work in')
                    .replace(/as a \w+/g, 'in your field')
                    .replace(/Now that I know/g, 'Continuing with')
                    .replace(/I can see/g, 'Let\'s discuss');
  }
  
  return basePrompt;
}
