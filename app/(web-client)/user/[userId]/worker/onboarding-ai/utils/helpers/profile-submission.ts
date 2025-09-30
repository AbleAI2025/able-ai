import { saveWorkerProfileFromOnboardingAction, createWorkerProfileAction } from "@/actions/user/gig-worker-profile";
import { parseExperienceToNumeric } from "@/lib/utils/experienceParsing";
import { validateWorkerProfileData } from "@/app/components/onboarding/ManualProfileForm";
import { interpretJobTitle } from '../ai-systems/ai-utils';

/**
 * Extract key terms from text for hashtag generation
 */
function extractKeyTerms(text: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'];
  
  return text
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '').toLowerCase())
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .filter((word, index, arr) => arr.indexOf(word) === index); // Remove duplicates
}

export interface ProfileData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string | any[];
  hourlyRate?: number | string;
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

/**
 * Generate hashtags for profile data using AI
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
  try {
    if (!ai) {
      console.log('🔍 No AI service available, using fallback hashtags');
      return ['#worker', '#gig', '#freelance'];
    }

    const { geminiAIAgent } = await import('@/lib/firebase/ai');
    const { Schema } = await import('@firebase/ai');
    
    // Prepare equipment data for the prompt
    let equipmentText = '';
    if (Array.isArray(profileData.equipment)) {
      equipmentText = profileData.equipment.map(item => 
        typeof item === 'string' ? item : item.name
      ).join(', ');
    } else if (typeof profileData.equipment === 'string') {
      equipmentText = profileData.equipment;
    }

    const prompt = `Generate exactly 3 professional hashtags for this gig worker profile:

Skills: ${profileData.skills || 'Not provided'}
Experience: ${profileData.experience || 'Not provided'}
Equipment: ${equipmentText || 'Not provided'}
Location: ${profileData.location || 'Not provided'}

Generate 3 relevant, specific hashtags that would help this worker be found by clients. 
The 3rd hashtag should be based on their location.
Examples: For a chef in London: "#chef", "#culinary", "#london"
For a mechanic in Manchester: "#mechanic", "#automotive", "#manchester"
For a cleaner in Birmingham: "#cleaning", "#housekeeping", "#birmingham"

Be creative and specific - avoid generic hashtags. Use varied, professional terms that reflect their actual skills and equipment.

Return only the hashtags, no explanations.`;

    const response = await geminiAIAgent(
      "gemini-2.0-flash",
      {
        prompt: prompt,
        responseSchema: Schema.object({
          properties: {
            hashtags: Schema.array({
              items: Schema.string()
            })
          },
          required: ["hashtags"]
        }),
        isStream: false,
      },
      ai
    );
    
    if (response.ok && response.data) {
      const data = response.data as { hashtags: string[] };
      console.log('🔍 AI generated hashtags:', data.hashtags);
      return data.hashtags.slice(0, 3); // Ensure max 3 hashtags
    } else {
      console.log('🔍 AI hashtag generation failed, using fallback');
      return ['#worker', '#gig', '#freelance'];
    }
    
  } catch (error) {
    console.error('Error generating hashtags:', error);
    return ['#worker', '#gig', '#freelance'];
  }
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
      location: typeof requiredData.location === 'string' ? requiredData.location : JSON.stringify(requiredData.location || ''),
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
    
    // Save profile with generated hashtags
    const profileDataWithHashtags = {
      ...requiredData,
      hashtags: hashtags
    };
    
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
      
      // Navigate to worker dashboard after a short delay
      setTimeout(() => {
        router.push(`/user/${userId}/worker`);
      }, 2000);
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
