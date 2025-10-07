import { parseLocationData } from '../locationUtils';
import { saveWorkerProfileFromOnboardingAction, createWorkerProfileAction } from "@/actions/user/gig-worker-profile";
import { parseExperienceToNumeric } from "@/lib/utils/experienceParsing";
import { validateWorkerProfileData } from "@/app/components/onboarding/ManualProfileForm";
import { interpretJobTitle } from '../ai-systems/ai-utils';

export interface ProfileData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string | any[];
  hourlyRate?: number | string;
  location?: { lat?: number; lng?: number, formatted_address?: string } | string;
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
  hashtags?: string[];
  experienceYears?: number;
  experienceMonths?: number;
  [key: string]: any;
}

export interface ChatStep {
  id: number;
  type: string;
  content?: string;
  isComplete?: boolean;
  [key: string]: any;
}

import { generateHashtags as generateHashtagsService, type ProfileData as HashtagProfileData } from '@/lib/services/hashtag-generation';

/**
 * Generate hashtags for profile data using AI
 * @deprecated Use generateHashtagsService from @/lib/services/hashtag-generation directly
 */
export async function generateHashtags(
  profileData: {
    about?: string;
    experience?: string;
    skills?: string;
    equipment?: string | any[];
    location?: string;
  },
  ai?: any
): Promise<string[]> {
  // Use the modular hashtag generation service
  return generateHashtagsService(profileData as HashtagProfileData, ai, {
    maxHashtags: 3,
    includeLocation: true,
    fallbackStrategy: 'skills-based'
  });
}

/**
 * Handle profile submission with hashtag generation
 */
export async function handleProfileSubmission(
  requiredData: ProfileData,
  userToken: string,
  userId: string,
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void,
  setWorkerProfileId: (id: string) => void,
  setError: (error: string | null) => void,
  router: any,
  ai?: any
): Promise<void> {
  try {
    // Add hashtag generation step to chat
    const hashtagStepId = Date.now();
    const hashtagStep: ChatStep = {
      id: hashtagStepId,
      type: "hashtag-generation",
      isComplete: false
    };
    setChatSteps(prev => [...prev, hashtagStep]);
    
    // Generate hashtags
    const hashtagData = {
      about: requiredData.about,
      experience: requiredData.experience,
      skills: requiredData.skills,
      equipment: requiredData.equipment,
    };
    console.log('🔍 Hashtag generation data:', hashtagData);
    const hashtags = await generateHashtags(hashtagData, ai);
    console.log('🔍 Generated hashtags:', hashtags);
    
    // Mark hashtag step as complete
    setChatSteps(prev => prev.map(step => 
      step.id === hashtagStepId ? { ...step, isComplete: true } : step
    ));
    
    // Add profile saving step
    const savingStepId = Date.now() + 1;
    const savingStep: ChatStep = {
      id: savingStepId,
      type: "bot",
      content: "Saving your profile with generated hashtags...",
      isComplete: false
    };
    setChatSteps(prev => [...prev, savingStep]);

    // Start with required data and hashtags; only add/override location/lat/lng if we have parsed location data
    const profileDataWithHashtags: any = {
      ...requiredData,
      hashtags: hashtags
    };

    const { databaseLocation } = parseLocationData(requiredData.location);

    if (databaseLocation) {
      if (databaseLocation.location) {
        profileDataWithHashtags.location = databaseLocation.location;
      }
      if (databaseLocation.latitude) {
        profileDataWithHashtags.latitude = databaseLocation.latitude;
      }
      if (databaseLocation.longitude) {
        profileDataWithHashtags.longitude = databaseLocation.longitude;
      }
    }
    
    // Debug: Log the data being sent to the action
    console.log('🔍 Data being sent to action:', profileDataWithHashtags);
    console.log('🔍 requiredData:', requiredData);
    
    const result = await saveWorkerProfileFromOnboardingAction(profileDataWithHashtags as any, userToken);
    
    // Mark saving step as complete
    setChatSteps(prev => prev.map(step => 
      step.id === savingStepId ? { ...step, isComplete: true } : step
    ));
    
    if (result.success) {
      if (result.workerProfileId) {
        setWorkerProfileId(result.workerProfileId);
      }
      
      // Add success step
      const successStep: ChatStep = {
        id: Date.now() + 2,
        type: "bot",
        content: "🎉 Profile created successfully! Redirecting to your dashboard...",
        isComplete: true
      };
      setChatSteps(prev => [...prev, successStep]);
      
      router.push(`/user/${userId}/worker`);
    } else {
      console.error('Profile submission failed:', result.error);
      const errorMessage = result.error || 'Failed to save profile. Please try again.';
      setError(errorMessage);
      
      // Add error step to show the actual error to user
      const errorStep: ChatStep = {
        id: Date.now() + 2,
        type: "bot",
        content: `❌ Profile submission failed: ${errorMessage}`,
        isComplete: true
      };
      setChatSteps(prev => [...prev, errorStep]);
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    setError('An error occurred while saving your profile. Please try again.');
  }
}

/**
 * Create worker profile automatically
 */
export async function createWorkerProfile(
  userToken: string,
  setWorkerProfileId: (id: string) => void,
  setError: (error: string | null) => void
): Promise<string | null> {
  try {
    const result = await createWorkerProfileAction(userToken);
    
    if (result.success && result.workerProfileId) {
      setWorkerProfileId(result.workerProfileId);
      return result.workerProfileId;
    } else {
      setError('Failed to create worker profile. Please try again.');
      return null;
    }
  } catch (error) {
    setError('Failed to create worker profile. Please try again.');
    return null;
  }
}

/**
 * Process and validate form data for submission
 */
export function processFormDataForSubmission(
  formData: any,
  ai?: any
): Promise<ProfileData> {
  return new Promise(async (resolve, reject) => {
    try {
      // Extract job title from skills field if not already provided
      let extractedJobTitle = formData.jobTitle || '';
      if (!extractedJobTitle && formData.skills && ai) {
        try {
          const jobTitleResult = await interpretJobTitle(formData.skills, ai);
          if (jobTitleResult && jobTitleResult.confidence >= 50) {
            extractedJobTitle = jobTitleResult.jobTitle;
          }
        } catch (error) {
        }
      }

      // Parse experience to get numeric values
      const { years: experienceYears, months: experienceMonths } = parseExperienceToNumeric(formData.experience || '');
      
      const requiredData: ProfileData = {
        about: formData.about || '',
        experience: formData.experience || '',
        skills: formData.skills || '',
        qualifications: formData.qualifications || '',
        equipment: typeof formData.equipment === 'string' && formData.equipment.trim().length > 0
          ? formData.equipment.split(/[,\n;]/).map((item: string) => ({ name: item.trim(), description: undefined })).filter((item: { name: string; description: undefined }) => item.name.length > 0)
          : [],
        hourlyRate: String(formData.hourlyRate || ''),
        location: typeof formData.location === 'string' ? formData.location : JSON.stringify(formData.location || ''),
        availability: formData.availability || { 
          days: [], 
          startTime: '09:00', 
          endTime: '17:00',
          frequency: 'weekly',
          ends: 'never',
          startDate: new Date().toISOString().split('T')[0],
          endDate: undefined,
          occurrences: undefined
        },
        videoIntro: typeof formData.videoIntro === 'string' ? formData.videoIntro : '',
        time: formData.time || '',
        jobTitle: formData.jobTitle || extractedJobTitle,
        experienceYears: experienceYears,
        experienceMonths: experienceMonths
      };
      
      resolve(requiredData);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Validate form data before submission
 */
export function validateFormData(formData: any): { isValid: boolean; errors: Record<string, string> } {
  const validation = validateWorkerProfileData(formData);
  return validation;
}

/**
 * Handle manual form submission
 */
export async function handleManualFormSubmission(
  formData: any,
  userToken: string,
  userId: string,
  setError: (error: string | null) => void,
  setIsSubmitting: (submitting: boolean) => void,
  router: any,
  ai?: any
): Promise<void> {
  if (!userToken) {
    setError('Authentication required. Please sign in again.');
    return;
  }

  // Validate the form data before proceeding
  const validation = validateFormData(formData);
  if (!validation.isValid) {
    setError(`Form validation failed: ${Object.values(validation.errors).join(', ')}`);
    return;
  }

  setIsSubmitting(true);
  setError(null);
  
  try {
    const requiredData = await processFormDataForSubmission(formData, ai);
    
    // Save the profile data to database
    await handleProfileSubmission(
      requiredData,
      userToken,
      userId,
      () => {}, // setChatSteps - not needed for manual form
      () => {}, // setWorkerProfileId - not needed for manual form
      setError,
      router,
      ai
    );
  } catch (error) {
    setError('Failed to save profile. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
}
