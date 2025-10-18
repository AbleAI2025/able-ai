/**
 * useHospitalityHandlers.ts
 * 
 * Custom hook for UK Hospitality onboarding handlers.
 * Extends the existing onboarding handlers with hospitality-specific logic.
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import existing onboarding handlers
import { useOnboardingHandlers } from '../../onboarding-ai/hooks/useOnboardingHandlers';

// Import hospitality-specific utilities
import { 
  processUserInput, 
  confirmSanitizedData, 
  createBotStep,
  createTypingStep,
  getPhaseProgress,
  createPhaseIndicatorSteps,
  initializeHospitalityFlow,
  isHospitalityPhaseComplete,
  isAllFieldsComplete
} from '../utils/hospitality-step-flow';

import { HOSPITALITY_PROMPTS } from '../utils/hospitality-prompts';
import { validateHospitalityField } from '../utils/hospitality-field-setters';

// Import AI utilities for Gemini 2.5 Flash
import { generateAIVideoScript, generateAIProfileSummary } from '../../onboarding-ai/utils/ai-systems/ai-utils';
import { generateHospitalityVideoScript, generateHospitalityProfileSummary } from '../utils/hospitality-ai-utils';

// Import database actions
import { saveWorkerProfileFromOnboardingAction } from '@/actions/user/gig-worker-profile';

// Import Firebase storage for video uploads
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { updateVideoUrlWorkerProfileAction } from '@/actions/user/gig-worker-profile';

export interface HospitalityFormData {
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
  summaryData?: HospitalityFormData;
  aiScript?: string;
}

/**
 * Custom hook for hospitality onboarding handlers
 */
export function useHospitalityHandlers({
  formData,
  setFormData,
  chatSteps,
  setChatSteps,
  user,
  ai,
  setError,
  setIsSubmitting,
  router
}: {
  formData: HospitalityFormData;
  setFormData: (data: HospitalityFormData) => void;
  chatSteps: ChatStep[];
  setChatSteps: (steps: ChatStep[] | ((prev: ChatStep[]) => ChatStep[])) => void;
  user: any;
  ai: any;
  setError: (error: string) => void;
  setIsSubmitting: (submitting: boolean) => void;
  router: any;
}) {

  /**
   * Handle input submission for hospitality fields
   */
  const handleHospitalityInputSubmit = useCallback(async (
    stepId: number, 
    inputName: string, 
    inputValue?: string
  ): Promise<boolean> => {
    const valueToUse = inputValue ?? formData[inputName];
    if (!valueToUse) {
      console.error('No value provided for input submission');
      return false;
    }

    // Mark input step as complete
    setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) => 
      step.id === stepId ? { ...step, isComplete: true } : step
    ));

    // Add typing indicator
    setChatSteps((prev: ChatStep[]) => [...prev, createTypingStep()]);

    try {
      // Process the input using hospitality-specific logic
      const result = await processUserInput(inputName, valueToUse, formData, chatSteps);
      
      // Remove typing indicator
      setChatSteps((prev: ChatStep[]) => prev.filter(step => step.type !== 'typing'));

      if (result.success) {
        // Add the next steps
        setChatSteps((prev: ChatStep[]) => [...prev, ...result.nextSteps]);
        return true;
      } else {
        // Add error message
        setChatSteps((prev: ChatStep[]) => [...prev, ...result.nextSteps]);
        return false;
      }
    } catch (error) {
      console.error('Error processing hospitality input:', error);
      setError('Sorry, there was an error processing your response. Please try again.');
      return false;
    }
  }, [formData, setFormData, chatSteps, setChatSteps, setError]);

  /**
   * Handle sanitized data confirmation
   */
  const handleSanitizedConfirm = useCallback(async (
    fieldName: string, 
    sanitizedValue: any, 
    extractedData?: any
  ) => {
    try {
      // Hospitality-specific behavior: append venue experience, specific skills, and work traits to about
      if (fieldName === 'venueExperience' || fieldName === 'specificSkills' || fieldName === 'workTraits') {
        const currentAbout = (formData.about || '').trim();
        const addition = (typeof sanitizedValue === 'string' ? sanitizedValue : JSON.stringify(sanitizedValue)).trim();
        // Create a clean concatenation with punctuation and de-duplication by simple contains
        const separator = currentAbout && !currentAbout.endsWith('.') ? '. ' : (currentAbout ? ' ' : '');
        const newAbout = currentAbout
          ? (currentAbout.includes(addition) ? currentAbout : (currentAbout + separator + addition))
          : addition;

        // Update about immediately alongside the field
        setFormData({ ...formData, [fieldName]: sanitizedValue, about: newAbout });

        // If workTraits confirmed (phase 5), compose a concise AI-written About combining phases 2,4,5
        if (fieldName === 'workTraits') {
          try {
            const composedAbout = await generateHospitalityProfileSummary({
              ...formData,
              [fieldName]: sanitizedValue,
              about: newAbout
            }, ai);
            if (composedAbout && typeof composedAbout === 'string') {
              setFormData((prev: any) => ({ ...prev, about: composedAbout }));
            }
          } catch (e) {
            // Non-fatal; keep concatenated about
            console.error('Failed to compose AI about:', e);
          }
        }
      }

      // Confirm the sanitized data and get next steps
      const result = confirmSanitizedData(fieldName, sanitizedValue, formData, chatSteps);
      
      // Update form data
      setFormData(result.updatedFormData);
      
      // Add next steps
      setChatSteps((prev: ChatStep[]) => [...prev, ...result.nextSteps]);
      
    } catch (error) {
      console.error('Error confirming sanitized data:', error);
      setError('Failed to confirm. Please try again.');
    }
  }, [formData, setFormData, chatSteps, setChatSteps, setError]);

  /**
   * Handle video upload with hospitality-specific script generation
   */
  const handleVideoUpload = useCallback(async (file: Blob, name?: string, stepId?: number) => {
    try {
      const storage = getStorage(firebaseApp);
      const fileName = `workers/${user?.uid}/introVideo/hospitality-introduction-${encodeURI(user?.email ?? user?.uid)}.webm`;
      const storageReference = storageRef(storage, fileName);
      
      const uploadTask = uploadBytesResumable(storageReference, file);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking could be added here
        },
        (error) => {
          setError('Video upload failed. Please try again.');
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update video URL in profile
            if (!user?.token) {
              throw new Error("Authentication token is required");
            }
            await updateVideoUrlWorkerProfileAction(downloadURL, user.token);
            
            // Update form data
            const updatedFormData = { ...formData, videoIntro: downloadURL };
            setFormData(updatedFormData);

            // Generate hospitality-specific AI video script
            let aiScript = '';
            try {
              aiScript = await generateHospitalityVideoScript(updatedFormData, ai);
            } catch (scriptError) {
              console.error('Hospitality AI script generation failed:', scriptError);
            }

            // Mark video step as complete and add sanitized confirmation step
            setChatSteps((prev: ChatStep[]) => prev.map((step: ChatStep) => 
              step.id === stepId ? { ...step, isComplete: true } : step
            ).concat([{
              id: Date.now(),
              type: "sanitized",
              fieldName: "videoIntro",
              sanitizedValue: downloadURL,
              originalValue: "Video uploaded",
              aiScript: aiScript,
              naturalSummary: "I saved your hospitality video introduction! 🎥",
              extractedData: JSON.stringify({ videoIntro: downloadURL }),
              isNew: true,
            }]));
          } catch (error) {
            setError('Failed to save video. Please try again.');
          }
        }
      );
    } catch (error) {
      setError('Video upload failed. Please try again.');
    }
  }, [formData, setFormData, chatSteps, setChatSteps, user, setError, ai]);

  /**
   * Handle profile submission with hospitality field mapping
   */
  const handleProfileSubmission = useCallback(async (summaryData?: HospitalityFormData) => {
    if (!user?.token) {
      setError('Authentication required. Please sign in again.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Generate AI profile summary for hospitality
      let aiProfileSummary = '';
      try {
        aiProfileSummary = await generateHospitalityProfileSummary(
          summaryData || formData, 
          ai
        );
      } catch (summaryError) {
        console.error('Hospitality AI profile summary generation failed:', summaryError);
      }
      
      // Map hospitality fields to database schema
      const submissionData = mapHospitalityFieldsToDatabase(summaryData || formData);
      
      // Debug: Log the data being sent
      console.log('🔍 Hospitality profile submission data:', submissionData);
      
      // Use the existing profile submission action
      const result = await saveWorkerProfileFromOnboardingAction(submissionData, user.token);
      
      if (result.success) {
        // Navigate to worker profile page
        router.push(`/user/${user.uid}/worker/profile`);
        return { success: true, message: 'Hospitality profile saved successfully!' };
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving hospitality profile:', error);
      setError('Failed to save profile. Please try again.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, setError, setIsSubmitting, formData, ai, router]);

  /**
   * Map hospitality fields to database schema
   */
  const mapHospitalityFieldsToDatabase = useCallback((data: HospitalityFormData) => {
    // Parse main skill into skills and experience
    const mainSkillResult = validateHospitalityField('mainSkill', data.mainSkill || '');
    
    return {
      // Map hospitality fields to database fields
      about: [
        data.venueExperience,
        data.workTraits,
        data.qualifications === 'No formal qualifications' ? '' : data.qualifications
      ].filter(Boolean).join(' '),
      
      skills: mainSkillResult.ok ? mainSkillResult.skills : data.mainSkill,
      experience: mainSkillResult.ok ? mainSkillResult.experienceText : '',
      
      qualifications: data.qualifications === 'No formal qualifications' ? undefined : data.qualifications || undefined,
      equipment: data.equipment || [],
      
      location: typeof data.location === 'string' ? data.location : JSON.stringify(data.location || {}),
      availability: typeof data.availability === 'string' ? data.availability : JSON.stringify(data.availability || []),
      
      hourlyRate: String(data.hourlyRate || ''),
      videoIntro: data.videoIntro || '',
      
      // Additional fields
      references: '',
      jobTitle: mainSkillResult.ok ? mainSkillResult.skills : data.mainSkill,
      experienceYears: mainSkillResult.ok ? mainSkillResult.years : 0,
      experienceMonths: 0
    };
  }, []);

  /**
   * Initialize the hospitality flow
   */
  const initializeFlow = useCallback(() => {
    const initialSteps = initializeHospitalityFlow();
    setChatSteps(initialSteps);
  }, [setChatSteps]);

  /**
   * Get phase progress information
   */
  const getProgress = useCallback(() => {
    return getPhaseProgress(formData);
  }, [formData]);

  /**
   * Check if hospitality phases are complete
   */
  const isHospitalityComplete = useCallback(() => {
    return isHospitalityPhaseComplete(formData);
  }, [formData]);

  /**
   * Check if all fields are complete
   */
  const isAllComplete = useCallback(() => {
    return isAllFieldsComplete(formData);
  }, [formData]);

  return {
    // Hospitality-specific handlers
    handleHospitalityInputSubmit,
    handleSanitizedConfirm,
    handleVideoUpload,
    handleProfileSubmission,
    
    // Utility functions
    initializeFlow,
    getProgress,
    isHospitalityComplete,
    isAllComplete,
    mapHospitalityFieldsToDatabase
  };
}
