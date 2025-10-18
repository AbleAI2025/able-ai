import { generateContextAwarePrompt, generateConversationAwarePrompt, sanitizeWithAI, extractSkillName } from '../ai-systems/ai-utils';
import { buildConversationContext, generateMemoryAwarePrompt, generateAlternativePhrasing } from '../ai-systems/conversation-memory';
import { buildRecommendationLink } from '../helpers/helpers';
import { buildJobTitleConfirmationStep, buildSimilarSkillsConfirmationStep } from './step-builders';
import { checkExistingSimilarSkill, interpretJobTitle } from '../ai-systems/ai-utils';
import { requiredFields as REQUIRED_FIELDS_CONFIG, specialFields as SPECIAL_FIELDS_CONFIG } from './questions';

// Type definitions
export interface RequiredField {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
}

export interface FormData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string;
  hourlyRate?: number;
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
  videoIntro?: string;
  references?: string;
  jobTitle?: string;
  [key: string]: any;
}

export interface ChatStep {
  id: number;
  type: "bot" | "user" | "input" | "sanitized" | "typing" | "calendar" | "location" | "confirm" | "video" | "shareLink" | "availability" | "jobTitleConfirmation" | "similarSkillsConfirmation" | "summary" | "support" | "hashtag-generation" | "confirmation";
  content?: string;
  inputConfig?: {
    type: string;
    name: string;
    placeholder?: string;
    rows?: number;
  };
  confirmationConfig?: {
    type: 'location' | 'availability' | 'skills' | 'bio';
    existingValue: string;
    fieldName: string;
  };
  isComplete?: boolean;
  sanitizedValue?: string | any;
  originalValue?: string | any;
  fieldName?: string;
  isNew?: boolean;
  linkUrl?: string;
  linkText?: string;
  naturalSummary?: string;
  extractedData?: string;
  suggestedJobTitle?: string;
  matchedTerms?: string[];
  isAISuggested?: boolean;
  confidence?: number;
  similarSkills?: any[];
  summaryData?: FormData;
  confirmedChoice?: 'title' | 'original' | 'existing' | 'new';
}

const requiredFields: RequiredField[] = REQUIRED_FIELDS_CONFIG;
const specialFields: RequiredField[] = SPECIAL_FIELDS_CONFIG;

/**
 * Get the next required field that hasn't been filled
 */
export function getNextRequiredField(
  formData: FormData, 
  existingProfileData?: any,
  customRequiredFields?: RequiredField[],
  customSpecialFields?: RequiredField[]
): RequiredField | undefined {
  // Use custom fields if provided, otherwise fall back to default
  const fieldsToUse = customRequiredFields || requiredFields;
  const specialFieldsToUse = customSpecialFields || specialFields;
  
  // First, find the first required field that hasn't been filled in formData
  let nextField = fieldsToUse.find((f: RequiredField) => !formData[f.name]);
  
  // Special handling: if qualifications is the next field but user has provided bio with qualifications info,
  // skip to video step to avoid asking for redundant information
  if (nextField?.name === 'qualifications' && formData.about && formData.about.length > 50) {
    // Find the next field after qualifications
    const qualificationsIndex = fieldsToUse.findIndex(f => f.name === 'qualifications');
    nextField = fieldsToUse[qualificationsIndex + 1];
  }
  
  // If no required field is missing, check special fields
  if (!nextField) {
    nextField = specialFieldsToUse.find((f: RequiredField) => !formData[f.name]);
  }
  
  return nextField;
}

/**
 * Check if all required fields are completed
 */
export function areAllRequiredFieldsCompleted(formData: FormData, customRequiredFields?: RequiredField[]): boolean {
  const fieldsToCheck = customRequiredFields || requiredFields;
  const allFieldsCompleted = fieldsToCheck.every(field => {
    const hasValue = !!formData[field.name];
    return hasValue;
  });
  return allFieldsCompleted;
}

/**
 * Check if there's already an active step for a field
 */
export function hasActiveStepForField(fieldName: string, chatSteps: ChatStep[]): boolean {
  return chatSteps.some((step: ChatStep) => 
    (step.type === 'input' || step.type === 'sanitized' || step.type === 'confirmation' || 
     step.type === 'jobTitleConfirmation' || step.type === 'similarSkillsConfirmation') &&
    step.fieldName === fieldName && 
    !step.isComplete
  );
}

/**
 * Check if this is the active input step
 */
export function isActiveInputStep(step: ChatStep, idx: number, chatSteps: ChatStep[]): boolean {
  const lastIncompleteInputStep = chatSteps
    .filter((s: ChatStep) => (s.type === 'input' || s.type === 'calendar' || s.type === 'location') && !s.isComplete)
    .pop();
  
  return step.id === lastIncompleteInputStep?.id;
}

/**
 * Check if we need to show confirmation for existing data
 */
export function shouldShowExistingDataConfirmation(
  fieldName: string,
  existingProfileData: any
): boolean {
  if (!existingProfileData) return false;
  
  switch (fieldName) {
    case 'about':
      return existingProfileData.hasFullBio;
    case 'location':
      return existingProfileData.hasLocation;
    case 'availability':
      return existingProfileData.hasAvailability;
    case 'skills':
      return false; // Don't check existing data for skills
    case 'hourlyRate':
      return false; // Don't check existing data for hourly rate
    default:
      return false;
  }
}

/**
 * Get existing data value for a field
 */
export function getExistingDataValue(fieldName: string, existingProfileData: any): string {
  if (!existingProfileData?.profileData) return '';
  
  switch (fieldName) {
    case 'about':
      return existingProfileData.profileData.fullBio || '';
    case 'location':
      return existingProfileData.profileData.location || '';
    case 'availability':
      return existingProfileData.profileData.availabilityJson ? 
        JSON.stringify(existingProfileData.profileData.availabilityJson) : '';
    case 'skills':
      return existingProfileData.profileData.skills || '';
    case 'hourlyRate':
      return existingProfileData.profileData.hourlyRate || '';
    default:
      return '';
  }
}

/**
 * Add the next step safely (prevents duplicates)
 */
export async function addNextStepSafely(
  formData: FormData,
  ai: any,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  workerProfileId: string | null,
  existingProfileData?: any,
  customRequiredFields?: RequiredField[],
  customSpecialFields?: RequiredField[]
): Promise<void> {
  const nextField = getNextRequiredField(formData, existingProfileData, customRequiredFields, customSpecialFields);
  
  if (!nextField) {
    // Check if all required fields are completed - if so, show references step
    if (areAllRequiredFieldsCompleted(formData, customRequiredFields)) {
      
      // Use existing worker profile ID
      if (!workerProfileId) {
        console.error('Worker profile not yet created');
        return;
      }
      
      const recommendationLink = buildRecommendationLink(workerProfileId);
      
      // Add typing indicator first
      setChatSteps((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "typing",
          isNew: true,
        },
      ]);

      // Replace typing indicator with separate messages after delay
      setTimeout(() => {
        setChatSteps((prev) => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            // First message: Instructions
            {
              id: Date.now() + 2,
              type: "bot",
              content: "You need one reference per skill, from previous managers, colleagues or teachers.\n\nIf you do not have experience you can get a character reference from a friend or someone in your network.",
              isNew: true,
            },
            // Second message: Share link
            {
              id: Date.now() + 3,
              type: "shareLink",
              linkUrl: recommendationLink,
              linkText: "Share this link to get your reference",
              isNew: true,
            },
            // Third message: Gigfolio info
            {
              id: Date.now() + 4,
              type: "bot",
              content: "Please check out your gigfolio and share with your network\n\nif your connections make a hire on Able you get £5!",
              isNew: true,
            },
            // Fourth message: Stripe connection
            {
              id: Date.now() + 5,
              type: "bot",
              content: "Follow this link to connect to Stripe so you can be paid at the end of your shift",
              isNew: true,
            },
            // Fifth message: Stripe link
            {
              id: Date.now() + 6,
              type: "shareLink",
              linkUrl: "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=YOUR_STRIPE_CLIENT_ID&scope=read_write",
              linkText: "Connect to Stripe",
              isNew: true,
            }
          ];
        });
      }, 1000);
      
      // After references, show AI-generated summary first
      setTimeout(async () => {
        
        // Generate AI summary with timeout
        let aiSummary = '';
        try {
          
          // Add timeout to prevent hanging
          const summaryPromise = (async () => {
            const { geminiAIAgent } = await import('@/lib/firebase/ai');
            
            const summaryPrompt = `Create a personalized summary of this worker's profile based on their onboarding information:

Profile Information:
- About: ${formData.about || 'Not provided'}
- Skills/Profession: ${formData.skills || 'Not provided'}
- Experience: ${formData.experience || 'Not provided'}
- Qualifications: ${formData.qualifications || 'Not provided'}
- Equipment: ${formData.equipment || 'Not provided'}
- Hourly Rate: ${formData.hourlyRate || 'Not provided'}
- Location: ${formData.location || 'Not provided'}

Create a warm, professional summary that highlights their key strengths and experience. Make it personal and engaging, like you're introducing them to potential clients. Keep it concise but comprehensive.

Example format:
"Meet [Name], a skilled [profession] with [experience] of experience. [He/She] specializes in [key skills] and brings [qualifications] to every project. Based in [location], [he/she] is available at [hourly rate] and is equipped with [equipment]. [Personal touch about their background]."

Generate a summary:`;

            const { Schema } = await import('@firebase/ai');
            
            const response = await geminiAIAgent(
              "gemini-2.0-flash",
              {
                prompt: summaryPrompt,
                responseSchema: Schema.object({
                  properties: {
                    summary: Schema.string()
                  }
                }),
                isStream: false,
              },
              ai
            );
            
            if (response.ok && response.data) {
              const data = response.data as { summary: string };
              return data.summary;
            }
            return null;
          })();
          
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI summary timeout')), 10000) // 10 second timeout
          );
          
          aiSummary = await Promise.race([summaryPromise, timeoutPromise]) as string;
          
          if (!aiSummary) {
            throw new Error('AI summary generation failed');
          }
          
        } catch (error) {
          console.error('AI summary generation failed:', error);
          // Fallback summary
          aiSummary = `Based on your profile, you're a skilled ${formData.skills || 'professional'} with ${formData.experience || 'valuable'} experience. You bring ${formData.qualifications || 'expertise'} to every project and are available at ${formData.hourlyRate || 'competitive'} rates.`;
        }
        
        // Add AI summary step
        setChatSteps((prev: ChatStep[]) => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            {
              id: Date.now() + 5,
              type: "bot",
              content: aiSummary,
              isNew: true,
            }
          ];
        });
        
        // After AI summary, show final summary component
        setTimeout(() => {
          setChatSteps((prev: ChatStep[]) => {
            const filtered = prev.filter(s => s.type !== 'typing');
            const newSteps = [...filtered, {
              id: Date.now() + 6,
              type: "summary" as const,
              summaryData: formData,
              isNew: true,
            }];
            return newSteps;
          });
        }, 3000); // Wait 3 seconds after AI summary to show final summary
      }, 4000); // Wait 4 seconds after references to show AI summary
    }
    return;
  }

  // Check if there's already an active step for this field
  if (hasActiveStepForField(nextField.name, chatSteps)) {
    return;
  }

  // Check if we need to show confirmation for existing data
  if (shouldShowExistingDataConfirmation(nextField.name, existingProfileData)) {
    const existingValue = getExistingDataValue(nextField.name, existingProfileData);
    
    setChatSteps((prev: ChatStep[]) => [
      ...prev,
      {
        id: Date.now(),
        type: "confirmation",
        confirmationConfig: {
          type: nextField.name === 'location' ? 'location' : 
                nextField.name === 'availability' ? 'availability' : 
                nextField.name === 'skills' ? 'skills' : 'bio',
          existingValue: existingValue,
          fieldName: nextField.name
        },
        isComplete: false,
        isNew: true,
      }
    ]);
    return;
  }

  // Check if all required fields are completed - if so, show references step
  if (areAllRequiredFieldsCompleted(formData)) {
    
    // Use existing worker profile ID
    if (!workerProfileId) {
      console.error('Worker profile not yet created');
      return;
    }
    
    const recommendationLink = buildRecommendationLink(workerProfileId);
    
    // Add typing indicator first
    setChatSteps((prev) => [
      ...prev,
      {
        id: Date.now() + 1,
        type: "typing",
        isNew: true,
      },
    ]);

    // Replace typing indicator with separate messages after delay
    setTimeout(() => {
      setChatSteps((prev) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        return [
          ...filtered,
          // First message: Instructions
          {
            id: Date.now() + 2,
            type: "bot",
            content: "You need one reference per skill, from previous managers, colleagues or teachers.\n\nIf you do not have experience you can get a character reference from a friend or someone in your network.",
            isNew: true,
          },
          // Second message: Share link
          {
            id: Date.now() + 3,
            type: "shareLink",
            linkUrl: recommendationLink,
            linkText: "Share this link to get your reference",
            isNew: true,
          },
          // Third message: Gigfolio info
          {
            id: Date.now() + 4,
            type: "bot",
            content: "Please check out your gigfolio and share with your network\n\nif your connections make a hire on Able you get £5!",
            isNew: true,
          },
          // Fourth message: Stripe connection
          {
            id: Date.now() + 5,
            type: "bot",
            content: "Follow this link to connect to Stripe so you can be paid at the end of your shift",
            isNew: true,
          },
          // Fifth message: Stripe link
          {
            id: Date.now() + 6,
            type: "shareLink",
            linkUrl: "https://connect.stripe.com/oauth/authorize?response_type=code&client_id=YOUR_STRIPE_CLIENT_ID&scope=read_write",
            linkText: "Connect to Stripe",
            isNew: true,
          }
        ];
      });
    }, 1000);
    
    // After references, proceed to summary step
    setTimeout(() => {
      setChatSteps((prev: ChatStep[]) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        const newSteps = [...filtered, {
          id: Date.now() + 5,
          type: "summary" as const,
          summaryData: formData,
          isNew: true,
        }];
        return newSteps;
      });
    }, 3000); // Wait 3 seconds after the last message
    return;
  }

  // Use the field's default prompt instead of generating context-aware prompt
  const newInputConfig = {
    type: nextField.type,
    name: nextField.name,
    ...(nextField.type !== 'video' && { placeholder: nextField.defaultPrompt }), // Don't set placeholder for video steps
    ...(nextField.rows && { rows: nextField.rows }),
  };
  
  // Determine the step type based on the field
  let stepType: "input" | "calendar" | "location" | "video" | "availability" = "input";
  if (nextField.name === "availability") {
    stepType = "availability";
  } else if (nextField.name === "location") {
    stepType = "location";
  } else if (nextField.name === "videoIntro") {
    stepType = "video";
  }
  
  // Add typing indicator first
  setChatSteps((prev) => [
    ...prev,
    {
      id: Date.now() + 1,
      type: "typing",
      isNew: true,
    },
  ]);

  // Replace typing indicator with intelligent bot message and input step after delay
  setTimeout(async () => {
    // Use default prompt directly - AI context-aware generation is unreliable
    const intelligentPrompt = nextField.defaultPrompt;
    
    // DISABLED: AI context-aware prompt generation due to AI not following instructions
    // The AI was generating wrong questions (location instead of skills)
    // TODO: Fix AI prompt generation or use a more reliable AI model
    /*
    try {
      // Use AI to generate contextual prompts
      let contextInfo = '';
      if (formData.skills) {
        contextInfo = `Skills: ${formData.skills}`;
      }
      if (formData.experience) {
        contextInfo += `, Experience: ${formData.experience}`;
      }
      
      intelligentPrompt = await generateContextAwarePrompt(nextField.name, contextInfo, ai);
      
      // Remove repetitive profession mentions from AI response
      if (formData.skills && intelligentPrompt.toLowerCase().includes(formData.skills.toLowerCase())) {
        // Replace repetitive mentions with generic versions
        intelligentPrompt = intelligentPrompt
          .replace(new RegExp(`since you're a ${formData.skills}`, 'gi'), '')
          .replace(new RegExp(`as a ${formData.skills}`, 'gi'), '')
          .replace(new RegExp(`being a ${formData.skills}`, 'gi'), '')
          .replace(new RegExp(`given your skills in ${formData.skills}`, 'gi'), '')
          .replace(new RegExp(`your ${formData.skills} work`, 'gi'), 'your work')
          .replace(new RegExp(`for your ${formData.skills}`, 'gi'), 'for your work')
          .replace(new RegExp(`job title`, 'gi'), 'profession')
          .replace(new RegExp(`job title or profession`, 'gi'), 'profession')
          .replace(new RegExp(`what's your job title`, 'gi'), 'what do you do for work')
          .replace(new RegExp(`your job title`, 'gi'), 'your profession')
          .trim();
      }
      
    } catch (error) {
      console.error('AI prompt generation failed:', error);
      // Fallback to default prompt
    }
    */

    setChatSteps((prev) => {
      const filtered = prev.filter(s => s.type !== 'typing');
      
      // For 'about' field (venue experience), only add bot message - use chat input at bottom
      if (nextField.name === 'about') {
        return [
          ...filtered,
          {
            id: Date.now() + 2,
            type: "bot",
            content: intelligentPrompt,
            isNew: true,
          },
        ];
      }
      
      // For all other fields, add both bot message and input field
      return [
        ...filtered,
        {
          id: Date.now() + 2,
          type: "bot",
          content: intelligentPrompt,
          isNew: true,
        },
        {
          id: Date.now() + 3,
          type: stepType,
          inputConfig: newInputConfig,
          isComplete: false,
          isNew: true,
        },
      ];
    });
  }, 1000);
}

/**
 * Handle input submission with AI-powered flow control
 */
export async function handleInputSubmission(
  stepId: number,
  inputName: string,
  inputValue: string,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  user: any,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any
): Promise<void> {
  const valueToUse = inputValue ?? formData[inputName];
  if (!valueToUse) {
    console.error('No value provided for input submission');
    return;
  }

  // Mark input step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) => 
    step.id === stepId ? { ...step, isComplete: true } : step
  ));

  // Update form data
  const updatedFormData = { ...formData, [inputName]: valueToUse };
  setFormData(updatedFormData);

  // Add typing indicator for AI processing
  setChatSteps((prev: ChatStep[]) => [
    ...prev,
    {
      id: Date.now() + 1,
      type: "typing",
      isNew: true,
    },
  ]);

  // Handle different field types
  if (inputName === 'skills') {
    // Only try job title interpretation if we don't already have a jobTitle
    if (!formData.jobTitle) {
      const jobTitleResult = await interpretJobTitle(valueToUse, ai);
      
      if (jobTitleResult && jobTitleResult.confidence >= 30) {
        setChatSteps((prev: ChatStep[]) => {
          const filtered = prev.filter(s => s.type !== 'typing');
          return [
            ...filtered,
            buildJobTitleConfirmationStep(stepId, inputName, valueToUse, jobTitleResult) as unknown as ChatStep,
          ];
        });
        return; // Exit early if we're showing job title confirmation
      }
    }
    
    // Extract skill name using AI before checking for similar skills
    const skillExtractionResult = await extractSkillName(valueToUse, ai);
    const skillNameToSearch = skillExtractionResult?.skillName || valueToUse;
    
    // Check for similar skills using the extracted skill name
    const similarSkillsResult = await checkExistingSimilarSkill(skillNameToSearch, workerProfileId || '');
    
    if (similarSkillsResult.exists && similarSkillsResult.similarSkills.length > 0) {
      // User already has this skill, show confirmation step
      setChatSteps((prev: ChatStep[]) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        return [
          ...filtered,
          buildSimilarSkillsConfirmationStep(stepId, inputName, valueToUse, similarSkillsResult.similarSkills) as unknown as ChatStep,
        ];
      });
    } else {
      // No similar skills found, continue with normal flow
      setChatSteps((prev: ChatStep[]) => prev.filter(s => s.type !== 'typing'));
      await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData);
    }
  } else {
    // Handle AI sanitization for all text input fields (like old onboarding)
    const sanitizedResult = await sanitizeWithAI(inputName, valueToUse);
    
    if (sanitizedResult.sanitized && sanitizedResult.sanitized !== valueToUse) {
      // AI made changes, show confirmation step
      setChatSteps((prev: ChatStep[]) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        return [
          ...filtered,
          buildSanitizedConfirmationStep(stepId, inputName, valueToUse, sanitizedResult.sanitized, sanitizedResult.naturalSummary),
        ];
      });
    } else {
      // No changes needed, continue with normal flow
      setChatSteps((prev: ChatStep[]) => prev.filter(s => s.type !== 'typing'));
      await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData);
    }
  }
}

/**
 * Handle job title confirmation
 */
export async function handleJobTitleConfirmation(
  fieldName: string,
  suggestedJobTitle: string,
  originalValue: string,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  user: any,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any
): Promise<void> {
  // Update formData with the standardized job title only
  const updatedFormData = { ...formData, jobTitle: suggestedJobTitle };
  setFormData(updatedFormData);
  
  // Mark job title confirmation step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) =>
    step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'title' } : step
  ));
  
  // Check if user already has similar skills for this job title
  const similarSkillsResult = await checkExistingSimilarSkill(suggestedJobTitle, user?.uid || '');
  
  if (similarSkillsResult.exists && similarSkillsResult.similarSkills.length > 0) {
    // Show similar skills confirmation step
    setChatSteps((prev: ChatStep[]) => [
      ...prev,
      buildSimilarSkillsConfirmationStep(Date.now(), fieldName, suggestedJobTitle, similarSkillsResult.similarSkills) as unknown as ChatStep,
    ]);
  } else {
    // No similar skills found, continue with regular flow
    await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData);
  }
}

/**
 * Handle job title rejection
 */
export async function handleJobTitleRejection(
  fieldName: string,
  originalValue: string,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any
): Promise<void> {
  // Update formData with the original value
  const updatedFormData = { ...formData, [fieldName]: originalValue };
  setFormData(updatedFormData);
  
  // Mark job title confirmation step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) =>
    step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'original' } : step
  ));
  
  // Continue with regular flow
  await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData);
}

/**
 * Handle similar skills confirmation - use existing skill
 */
export async function handleSimilarSkillsUseExisting(
  fieldName: string,
  selectedSkill: any,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any,
  onGoHome?: () => void
): Promise<void> {
  // Update formData with the existing skill data
  const updatedFormData = { 
    ...formData, 
    jobTitle: selectedSkill.name,
    skills: selectedSkill.name,
    experience: selectedSkill.experienceYears ? `${selectedSkill.experienceYears} years` : '',
    hourlyRate: selectedSkill.agreedRate ? parseFloat(selectedSkill.agreedRate) : formData.hourlyRate
  };
  setFormData(updatedFormData);
  
  // Mark similar skills confirmation step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) =>
    step.type === "similarSkillsConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'existing' } : step
  ));
  
  // Go back to home instead of continuing the flow
  if (onGoHome) {
    onGoHome();
  }
}

/**
 * Handle similar skills confirmation - add new skill
 */
export async function handleSimilarSkillsAddNew(
  fieldName: string,
  originalValue: string,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any
): Promise<void> {
  // Update formData with the original value
  const updatedFormData = { ...formData, [fieldName]: originalValue };
  setFormData(updatedFormData);
  
  // Mark similar skills confirmation step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) =>
    step.type === "similarSkillsConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'new' } : step
  ));
  
  // Add bot message asking for a new skill and an input step for the new skill
  setChatSteps((prev: ChatStep[]) => [...prev, {
    id: Date.now(),
    type: "bot",
    content: "What would you like to call your new skill?",
    isComplete: true,
    isNew: true,
  }, {
    id: Date.now() + 1,
    type: "input",
    fieldName: "skills",
    inputConfig: {
      type: "text",
      name: "skills",
      placeholder: "Enter your new skill name...",
      defaultPrompt: "What would you like to call your new skill?"
    },
    isComplete: false,
    isNew: true,
  }]);
}

/**
 * Handle sanitized confirmation
 */
export async function handleSanitizedConfirmation(
  fieldName: string,
  sanitized: string | unknown,
  formData: FormData,
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void,
  chatSteps: ChatStep[],
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  ai: any,
  workerProfileId: string | null,
  existingProfileData?: any
): Promise<void> {
  // For equipment field, we need to get the extracted data from the step
  let valueToStore = sanitized;
  if (fieldName === 'equipment') {
    // Find the sanitized step to get the extracted data
    const sanitizedStep = chatSteps.find(step => 
      step.type === 'sanitized' && step.fieldName === fieldName && !step.isComplete
    );
    
    if (sanitizedStep && sanitizedStep.extractedData && Array.isArray(sanitizedStep.extractedData)) {
      valueToStore = sanitizedStep.extractedData;
    } else if (typeof sanitized === 'string') {
      // Fallback: parse the sanitized string back to array
      const equipmentItems = sanitized.split(', ').map(name => ({ name: name.trim() }));
      valueToStore = equipmentItems;
    }
  }
  
  // Update formData first
  const updatedFormData = { ...formData, [fieldName]: valueToStore };
  setFormData(updatedFormData);
  
  // Mark sanitized step as complete
  setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) =>
    step.type === "sanitized" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
  ));
  
  // Find next required field using updated formData
  const nextField = getNextRequiredField(updatedFormData);
  
  if (nextField) {
    // Continue with regular flow
    await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData);
  } else {
    // All required fields completed, show summary step with submit button
    // Add typing indicator first
    setChatSteps((prev: ChatStep[]) => [...prev, {
      id: Date.now(),
      type: "typing",
      isNew: true,
    }]);

    // Replace typing indicator with summary step after delay
    setTimeout(() => {
      setChatSteps((prev: ChatStep[]) => {
        const filtered = prev.filter(s => s.type !== 'typing');
        return [...filtered, {
          id: Date.now() + 1,
          type: "summary",
          summaryData: updatedFormData,
          isNew: true,
        }];
      });
    }, 1000);
  }
}

/**
 * Build sanitized confirmation step
 */
export function buildSanitizedConfirmationStep(
  stepId: number,
  fieldName: string,
  originalValue: string,
  sanitizedValue: string,
  naturalSummary?: string
): ChatStep {
  return {
    id: stepId,
    type: "sanitized",
    fieldName: fieldName,
    originalValue: originalValue,
    sanitizedValue: sanitizedValue,
    naturalSummary: naturalSummary,
    isComplete: false,
    isNew: true,
  };
}

/**
 * Initialize chat steps based on existing data
 */
export function initializeChatSteps(
  existingData: any,
  formData: FormData,
  requiredFields: RequiredField[],
  specialFields: RequiredField[]
): ChatStep[] {
  const steps: ChatStep[] = [];
  
  // Add welcome message - only show custom message for new users
  if (!existingData) {
    // New user - show full welcome message
    steps.push({
      id: 1,
      type: "bot",
      content: "Hi! I'm here to help you create your worker profile. Tell me about yourself and what kind of work you can offer.",
      isComplete: true,
      isNew: true,
    });
  } else {
    // Existing user - show simple welcome message
    steps.push({
      id: 1,
      type: "bot",
      content: "Welcome back! Let me help you update your worker profile.",
      isComplete: true,
      isNew: true,
    });
  }

  // Find the first required field that doesn't have data
  let firstMissingField = requiredFields.find(field => !formData[field.name as keyof FormData]);
  
  // If no required field is missing, check special fields
  if (!firstMissingField) {
    firstMissingField = specialFields.find(field => {
      // Always show special fields, even if user has existing data
      // The confirmation step will handle existing data
      return true;
    });
  }
  
  if (firstMissingField) {
    console.log('First missing field:', firstMissingField.name);
    console.log('Existing data:', existingData);
    console.log('Should show confirmation:', existingData && shouldShowExistingDataConfirmation(firstMissingField.name, existingData));
    
    // Check if we have existing data for this field and need to show confirmation
    if (existingData && shouldShowExistingDataConfirmation(firstMissingField.name, existingData)) {
      const existingValue = getExistingDataValue(firstMissingField.name, existingData);
      console.log('Existing value for', firstMissingField.name, ':', existingValue);
      
      // Add confirmation step for existing data
      steps.push({
        id: steps.length + 1,
        type: "confirmation",
        content: `I can see you already have ${firstMissingField.name} information. Would you like to use your existing ${firstMissingField.name} or create a new one?`,
        confirmationConfig: {
          type: firstMissingField.name === 'location' ? 'location' : 
                firstMissingField.name === 'availability' ? 'availability' : 
                firstMissingField.name === 'skills' ? 'skills' : 'bio',
          existingValue: existingValue,
          fieldName: firstMissingField.name
        },
        isComplete: false,
        isNew: true,
      });
    } else {
      // DISABLED: Don't add the question here - let the step flow handle it
      // The step flow system will add the next step automatically
      // This prevents duplication between initialization and step flow systems
    }
    
    // Don't add input step - let the chat input handle the flow naturally
    // The user will type in the chat input and we'll process it
  }
  
  return steps;
}
