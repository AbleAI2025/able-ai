// Able AI Prompt Building Utilities
// Functions for building dynamic and context-aware prompts

import { BASE_SYSTEM_PROMPT, CONTEXT_PROMPTS, SPECIALIZED_PROMPTS } from './system-prompts';
import { GIGFOLIO_COACH_CONTENT } from '../roles/gigfolio-coach';
import { SHIFT_CONCIERGE_CONTENT } from '../roles/shift-concierge';

export const buildContextPrompt = (contextType: string, userQuery?: string, additionalContext?: string): string => {
  const basePrompt = CONTEXT_PROMPTS[contextType as keyof typeof CONTEXT_PROMPTS] || CONTEXT_PROMPTS.general;
  
  let result = `${BASE_SYSTEM_PROMPT}\n\n${basePrompt}`;
  
  if (additionalContext) {
    result += `\n\nAdditional Context: ${additionalContext}`;
  }
  
  if (userQuery) {
    result += `\n\nUser Query: ${userQuery}`;
  }
  
  return result;
};

export const buildRolePrompt = (role: 'gigfolioCoach' | 'shiftConcierge', context: string, userQuery?: string): string => {
  const roleContent = role === 'gigfolioCoach' ? GIGFOLIO_COACH_CONTENT : SHIFT_CONCIERGE_CONTENT;
  
  return `${BASE_SYSTEM_PROMPT}

${roleContent}

Context: ${context}

${userQuery ? `User Query: ${userQuery}` : ''}

Please respond according to your role and the provided context.`;
};

export const buildSpecializedPrompt = (specialization: string, userContext: string, userQuery: string): string => {
  const specializedPrompt = SPECIALIZED_PROMPTS[specialization as keyof typeof SPECIALIZED_PROMPTS];
  
  if (!specializedPrompt) {
    return buildContextPrompt('general', userQuery, userContext);
  }
  
  return `${BASE_SYSTEM_PROMPT}

${specializedPrompt}

User Context: ${userContext}

User Query: ${userQuery}

Please provide specialized assistance in this area.`;
};

export const buildTemplatePrompt = (template: string, variables: Record<string, string>): string => {
  let result = template;
  
  // Replace template variables with actual values
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return result;
};

export const buildMultiContextPrompt = (contexts: string[], userQuery: string): string => {
  const contextText = contexts.join('\n\n');
  
  return `${BASE_SYSTEM_PROMPT}

Context Information:
${contextText}

User Query: ${userQuery}

Please provide a comprehensive response that addresses all relevant aspects of the user's query.`;
};

export const buildProgressivePrompt = (steps: string[], currentStep: number, userQuery: string): string => {
  const completedSteps = steps.slice(0, currentStep);
  const nextSteps = steps.slice(currentStep);
  
  const result = `${BASE_SYSTEM_PROMPT}

Progress Update:
Completed Steps:
${completedSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

${nextSteps.length > 0 ? `Next Steps:\n${nextSteps.map((step, index) => `${currentStep + index + 1}. ${step}`).join('\n')}` : 'All steps completed!'}

User Query: ${userQuery}

Please provide guidance appropriate to the current progress level.`;

  return result;
};

export const buildErrorHandlingPrompt = (errorType: string, userQuery: string, context: string): string => {
  // Simple error handling without complex template lookup
  return `${BASE_SYSTEM_PROMPT}

Error Handling Context: ${errorType}

User Query: ${userQuery}

Additional Context: ${context}

Please help resolve this issue appropriately.`;
};
