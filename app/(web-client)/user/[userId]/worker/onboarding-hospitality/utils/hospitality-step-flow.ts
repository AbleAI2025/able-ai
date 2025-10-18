/**
 * hospitality-step-flow.ts
 * 
 * Step flow logic for UK Hospitality onboarding.
 * Manages progression through the 6 phases and standard fields.
 */

import { hospitalityFields, standardFields, getNextField, areHospitalityPhasesCompleted, areAllFieldsCompleted } from '../config/hospitality-fields';
import { getContextualPrompt, getClarificationPrompt } from './hospitality-prompts';
import { validateHospitalityField } from './hospitality-field-setters';

export interface ChatStep {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm" | "video" | "shareLink" | "availability" | "summary" | "support" | "confirmation";
  content?: string;
  inputConfig?: {
    type: string;
    name: string;
    placeholder?: string;
    rows?: number;
  };
  isComplete?: boolean;
  sanitizedValue?: string | any;
  originalValue?: string | any;
  fieldName?: string;
  isNew?: boolean;
  naturalSummary?: string;
  extractedData?: string;
  phase?: number;
  phaseName?: string;
  summaryData?: any;
}

export interface FormData {
  mainSkill?: string;
  venueExperience?: string;
  qualifications?: string;
  specificSkills?: string;
  workTraits?: string;
  equipment?: any[];
  location?: { lat: number; lng: number } | string;
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency?: string;
    ends?: string;
    startDate?: string;
    endDate?: string;
    occurrences?: number;
  } | string;
  hourlyRate?: number;
  videoIntro?: string;
  [key: string]: any;
}

/**
 * Get the current phase based on completed fields
 */
export function getCurrentPhase(formData: FormData): number {
  const completedFields = hospitalityFields.filter(field => formData[field.name]);
  return completedFields.length + 1;
}

/**
 * Get the next field that needs to be completed
 */
export function getNextRequiredField(formData: FormData): any {
  // First check hospitality fields (phases 1-6)
  const nextHospitalityField = hospitalityFields.find(field => !formData[field.name]);
  if (nextHospitalityField) {
    return nextHospitalityField;
  }

  // Then check standard fields (phases 7-10)
  const nextStandardField = standardFields.find(field => !formData[field.name]);
  if (nextStandardField) {
    return nextStandardField;
  }

  return null; // All fields completed
}

/**
 * Check if there's an active step for a field
 */
export function hasActiveStepForField(fieldName: string, chatSteps: ChatStep[]): boolean {
  return chatSteps.some((step: ChatStep) => 
    (step.type === 'input' || step.type === 'sanitized' || step.type === 'confirmation') &&
    step.fieldName === fieldName && 
    !step.isComplete
  );
}

/**
 * Check if this is the active input step
 */
export function isActiveInputStep(step: ChatStep, chatSteps: ChatStep[]): boolean {
  const lastIncompleteInputStep = chatSteps
    .filter((s: ChatStep) => (s.type === 'input' || s.type === 'calendar' || s.type === 'location') && !s.isComplete)
    .pop();
  
  return step.id === lastIncompleteInputStep?.id;
}

/**
 * Create an input step for a field
 */
export function createInputStep(field: any, formData: FormData): ChatStep {
  const prompt = getContextualPrompt(field.name, field.phase, formData);
  
  return {
    id: Date.now(),
    type: "input",
    fieldName: field.name,
    phase: field.phase,
    phaseName: field.phaseName,
    content: prompt,
    inputConfig: {
      type: field.type,
      name: field.name,
      placeholder: field.placeholder,
      rows: field.rows || 1
    },
    isComplete: false,
    isNew: true
  };
}

/**
 * Create a sanitized confirmation step
 */
export function createSanitizedStep(
  fieldName: string, 
  originalValue: string, 
  sanitizedValue: string, 
  naturalSummary: string,
  extractedData?: any
): ChatStep {
  return {
    id: Date.now(),
    type: "sanitized",
    fieldName: fieldName,
    originalValue: originalValue,
    sanitizedValue: sanitizedValue,
    naturalSummary: naturalSummary,
    extractedData: extractedData,
    isComplete: false,
    isNew: true
  };
}

/**
 * Create a bot message step
 */
export function createBotStep(content: string, phase?: number): ChatStep {
  return {
    id: Date.now(),
    type: "bot",
    content: content,
    phase: phase,
    isComplete: true,
    isNew: true
  };
}

/**
 * Create a typing indicator step
 */
export function createTypingStep(): ChatStep {
  return {
    id: Date.now(),
    type: "typing",
    isComplete: false,
    isNew: true
  };
}

/**
 * Process user input and create appropriate next steps
 */
export async function processUserInput(
  fieldName: string,
  inputValue: string,
  formData: FormData,
  chatSteps: ChatStep[]
): Promise<{ success: boolean; nextSteps: ChatStep[]; error?: string }> {
  
  // Validate the input using hospitality field setters
  const validationResult = validateHospitalityField(fieldName, inputValue);
  
  if (!validationResult.ok) {
    return {
      success: false,
      nextSteps: [
        createBotStep(validationResult.error || getClarificationPrompt(fieldName))
      ],
      error: validationResult.error
    };
  }

  // Create sanitized confirmation step
  const sanitizedStep = createSanitizedStep(
    fieldName,
    inputValue,
    validationResult[fieldName] || validationResult.sanitizedValue || inputValue,
    validationResult.naturalSummary || `Got it! ${validationResult[fieldName] || inputValue}`,
    validationResult.extractedData
  );

  return {
    success: true,
    nextSteps: [sanitizedStep]
  };
}

/**
 * Confirm sanitized data and proceed to next step
 */
export function confirmSanitizedData(
  fieldName: string,
  sanitizedValue: any,
  formData: FormData,
  chatSteps: ChatStep[]
): { updatedFormData: FormData; nextSteps: ChatStep[] } {
  
  // Update form data
  const updatedFormData = { ...formData, [fieldName]: sanitizedValue };
  
  // Mark sanitized step as complete
  const updatedChatSteps = chatSteps.map(step => 
    step.type === "sanitized" && step.fieldName === fieldName 
      ? { ...step, isComplete: true }
      : step
  );

  // Get next field
  const nextField = getNextRequiredField(updatedFormData);
  
const nextSteps: ChatStep[] = [];

  if (nextField) {
    // Create input step for next field
    const inputStep = createInputStep(nextField, updatedFormData);
    nextSteps.push(inputStep);
  } else {
    // All fields completed - create summary step
    const summaryStep = createSummaryStep(updatedFormData);
    nextSteps.push(summaryStep);
  }

  return {
    updatedFormData,
    nextSteps
  };
}

/**
 * Create a summary step for final confirmation
 */
export function createSummaryStep(formData: FormData): ChatStep {
  const summaryData = {
    mainSkill: formData.mainSkill,
    venueExperience: formData.venueExperience,
    qualifications: formData.qualifications,
    specificSkills: formData.specificSkills,
    workTraits: formData.workTraits,
    equipment: formData.equipment,
    location: formData.location,
    availability: formData.availability,
    hourlyRate: formData.hourlyRate,
    videoIntro: formData.videoIntro
  };

  return {
    id: Date.now(),
    type: "summary",
    content: "Here's your hospitality profile summary. Please review and confirm:",
    summaryData: summaryData,
    isComplete: false,
    isNew: true
  };
}

/**
 * Initialize the hospitality onboarding flow
 */
export function initializeHospitalityFlow(): ChatStep[] {
  const welcomeStep = createBotStep(
    "Welcome to Able AI! I'm your Gigfolio Coach, here to help you create an amazing hospitality profile for UK gigs. Let's get started!"
  );

  const firstField = hospitalityFields[0]; // mainSkill
  const firstInputStep = createInputStep(firstField, {});

  return [welcomeStep, firstInputStep];
}

/**
 * Check if hospitality phases (1-6) are completed
 */
export function isHospitalityPhaseComplete(formData: FormData): boolean {
  return areHospitalityPhasesCompleted(formData);
}

/**
 * Check if all fields are completed
 */
export function isAllFieldsComplete(formData: FormData): boolean {
  return areAllFieldsCompleted(formData);
}

/**
 * Get phase progress information
 */
export function getPhaseProgress(formData: FormData): {
  currentPhase: number;
  totalPhases: number;
  completedPhases: number;
  phaseName: string;
  progressPercentage: number;
} {
  const completedFields = hospitalityFields.filter(field => formData[field.name]);
  const currentPhase = completedFields.length + 1;
  const totalPhases = hospitalityFields.length;
  const completedPhases = completedFields.length;
  
  const currentField = hospitalityFields.find(field => field.phase === currentPhase);
  const phaseName = currentField?.phaseName || "Completed";

  return {
    currentPhase: Math.min(currentPhase, totalPhases),
    totalPhases,
    completedPhases,
    phaseName,
    progressPercentage: Math.round((completedPhases / totalPhases) * 100)
  };
}

/**
 * Create phase indicator steps
 */
export function createPhaseIndicatorSteps(formData: FormData): ChatStep[] {
  const progress = getPhaseProgress(formData);
  
  return [{
    id: Date.now(),
    type: "bot",
    content: `Phase ${progress.currentPhase} of ${progress.totalPhases}: ${progress.phaseName} (${progress.progressPercentage}% complete)`,
    isComplete: true,
    isNew: true
  }];
}
