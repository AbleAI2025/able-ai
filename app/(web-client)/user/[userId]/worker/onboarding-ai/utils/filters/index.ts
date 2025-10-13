/**
 * index.ts
 * 
 * Central export file for all filter functions.
 * This provides a clean interface for importing filters
 * throughout the onboarding system.
 */

// Export compatibility layer functions
export {
  checkInappropriateContent,
  checkOffTopicResponse,
  validateContentWithAI
} from '../validation/compatibility-layer';

// Export AI response validation functions
export {
  validateResponseWithAI,
  sanitizeResponseWithAI,
  processValidatedResponse,
  generateConfirmationMessage,
  handleUserConfirmation
} from './ai-response-validation';

