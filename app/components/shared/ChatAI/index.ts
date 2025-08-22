// ChatAI Module Exports - Organized Structure
// Central export file for all Able AI Chat components and utilities

// Core Values and Ethics
export * from './core/core-values';
export * from './core/ethical-standards';
export * from './core/platform-behavior';

// Content Moderation
export * from './moderation/content-moderation';

// Skills and Taxonomy
export * from './skills/skill-categories';
export * from './skills/skill-levels';
export * from './skills/semantic-matching';

// Job Titles and Classification
export * from './roles/JobTitles';

// Roles and Behaviors
export * from './roles/gigfolio-coach';
export * from './roles/shift-concierge';
export * from './roles/role-metrics';

// System Prompts and Instructions
export * from './prompts/system-prompts';
export * from './prompts/prompt-templates';
export * from './prompts/ai-behavior';
export * from './prompts/prompt-builders';

// Backward Compatibility - Re-export main content constants
export { 
  ETHICAL_STANDARDS,
  ETHICAL_STANDARDS_DETAILED,
  ETHICAL_ENFORCEMENT,
  ETHICAL_DECISION_MAKING
} from './core/ethical-standards';

export {
  SKILL_CATEGORIES,
  SKILL_CATEGORIES_DESCRIPTION,
  SKILL_RELATIONSHIPS
} from './skills/skill-categories';

export {
  SKILL_LEVELS,
  SKILL_LEVELS_DETAILED,
  LEVEL_ASSESSMENT,
  LEVEL_PROGRESSION,
  LEVEL_MATCHING
} from './skills/skill-levels';

export {
  SEMANTIC_MATCHING,
  SEMANTIC_MATCHING_DETAILED,
  MATCHING_ALGORITHMS,
  INDUSTRY_TERMINOLOGY,
  MATCHING_CRITERIA,
  MATCHING_OPTIMIZATION
} from './skills/semantic-matching';

export {
  GIGFOLIO_COACH_CONTENT,
  GIGFOLIO_COACH_BEHAVIOR,
  ONBOARDING_STEPS,
  COACHING_TECHNIQUES,
  ONBOARDING_RESOURCES
} from './roles/gigfolio-coach';

export {
  SHIFT_CONCIERGE_CONTENT,
  SHIFT_CONCIERGE_BEHAVIOR,
  GIG_CREATION_SUPPORT,
  EVENT_PLANNING_ASSISTANCE,
  WORKER_MATCHING_CRITERIA,
  GIG_MANAGEMENT_SUPPORT
} from './roles/shift-concierge';

export {
  ROLE_METRICS,
  GIGFOLIO_COACH_METRICS,
  SHIFT_CONCIERGE_METRICS,
  CROSS_ROLE_METRICS,
  METRIC_COLLECTION,
  METRIC_ANALYSIS
} from './roles/role-metrics';

export {
  BASE_SYSTEM_PROMPT,
  CONTEXT_PROMPTS,
  SPECIALIZED_PROMPTS,
  ROLE_SPECIFIC_PROMPTS,
  CONTEXT_SWITCHING
} from './prompts/system-prompts';

export {
  PROMPT_TEMPLATES,
  INTERACTION_TEMPLATES,
  SCENARIO_TEMPLATES,
  RESPONSE_TEMPLATES
} from './prompts/prompt-templates';

export {
  AI_BEHAVIOR_INSTRUCTIONS,
  TONE_GUIDELINES,
  RESPONSE_QUALITY_STANDARDS,
  QUALITY_ASSURANCE
} from './prompts/ai-behavior';

export {
  buildContextPrompt,
  buildRolePrompt,
  buildSpecializedPrompt,
  buildTemplatePrompt,
  buildMultiContextPrompt,
  buildProgressivePrompt,
  buildErrorHandlingPrompt
} from './prompts/prompt-builders';
