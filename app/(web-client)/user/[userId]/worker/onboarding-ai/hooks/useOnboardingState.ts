/**
 * useOnboardingState.ts
 * 
 * Custom hook that manages all state for the AI onboarding flow.
 * This hook centralizes state management and provides utility functions
 * for checking existing data and creating worker profiles.
 * 
 * State includes:
 * - Form data and chat steps
 * - UI state (typing, confirmations, errors)
 * - Existing profile data management
 * - Support and escalation tracking
 * - Hashtag generation state
 * - Profile management
 */

import { useState, useCallback } from 'react';
import { checkExistingProfileDataAction } from '@/actions/user/check-existing-profile-data-action';
import { initializeChatSteps } from '../utils/step-management/step-flow';
import { createWorkerProfileAction } from '@/actions/user/gig-worker-profile';
import type { ExistingProfileData } from '@/actions/user/check-existing-profile-data';
import { requiredFields as REQUIRED_FIELDS_CONFIG } from '../utils/step-management/questions';

/**
 * Custom hook for managing onboarding state
 * @param user - Current authenticated user
 * @returns Object containing all state and utility functions
 */
export function useOnboardingState(user: any) {
  // Core form and chat state
  const [formData, setFormData] = useState<any>({});                    // Current form data
  const [chatSteps, setChatSteps] = useState<any[]>([]);               // Chat conversation steps
  const [isSubmitting, setIsSubmitting] = useState(false);             // Submission state
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null); // Currently focused input
  
  // Existing profile data management
  const [existingProfileData, setExistingProfileData] = useState<ExistingProfileData | null>(null); // Existing user data
  const [isCheckingExistingData, setIsCheckingExistingData] = useState(true); // Loading state for data check
  
  // UI state management
  const [expandedSummaryFields, setExpandedSummaryFields] = useState<Record<string, boolean>>({}); // Expanded field states
  const [isTyping, setIsTyping] = useState(false);                    // AI typing indicator
  const [reformulateField, setReformulateField] = useState<string | null>(null); // Field being reformulated
  const [isReformulating, setIsReformulating] = useState(false);       // Reformulation state
  const [error, setError] = useState<string | null>(null);            // Current error message
  const [isConfirming, setIsConfirming] = useState(false);            // Confirmation state
  const [confirmedSteps, setConfirmedSteps] = useState<Set<number>>(new Set()); // Confirmed step IDs
  const [clickedSanitizedButtons, setClickedSanitizedButtons] = useState<Set<string>>(new Set()); // Clicked sanitized buttons
  
  // Support and escalation tracking
  const [unrelatedResponseCount, setUnrelatedResponseCount] = useState(0); // Count of unrelated responses
  const [inappropriateContentCount, setInappropriateContentCount] = useState(0); // Count of inappropriate content responses
  const [showHumanSupport, setShowHumanSupport] = useState(false);         // Show human support UI
  const [supportCaseId, setSupportCaseId] = useState<string | null>(null); // Support case ID
  
  // Hashtag generation state
  const [hashtagState, setHashtagState] = useState({
    isGenerating: false,        // Whether generating hashtags
    hashtags: [] as string[],   // Generated hashtags
    error: null as string | null // Hashtag generation error
  });

  // Worker profile management
  const [workerProfileId, setWorkerProfileId] = useState<string | null>(null); // Worker profile ID

  // Setup choice modal state
  const [showSetupChoice, setShowSetupChoice] = useState(true); // Show setup choice modal

  // Utility functions
  /**
   * Reset all onboarding state to initial values
   * Used when starting a new onboarding session or clearing errors
   */
  const resetState = useCallback(() => {
    setFormData({});
    setChatSteps([]);
    setIsSubmitting(false);
    setError(null);
    setReformulateField(null);
    setIsReformulating(false);
    setUnrelatedResponseCount(0);
    setShowHumanSupport(false);
    setSupportCaseId(null);
    setHashtagState({ isGenerating: false, hashtags: [], error: null });
  }, []);

  /**
   * Check for existing profile data for the current user
   * This function queries the database to see if the user already has profile information
   */
  const checkExistingData = useCallback(async () => {
    if (!user?.token) {
      // No user token available, skip existing data check
      return;
    }
    
    try {
      setIsCheckingExistingData(true);
      const result = await checkExistingProfileDataAction(user.token);
      
      if (result.success && result.data) {
        setExistingProfileData(result.data);
        
        // Initialize form data with existing data
        const existingFormData: any = {};
        
        // Don't pre-populate bio, location and availability - let the confirmation step handle them
        // Only pre-populate other fields that don't need confirmation
        // if (result.data.hasFullBio && result.data.profileData.fullBio) {
        //   existingFormData.about = result.data.profileData.fullBio;
        // }
        
        setFormData(existingFormData);
        
        // Initialize chat steps based on existing data
        const initialSteps = initializeChatSteps(result.data, existingFormData, REQUIRED_FIELDS_CONFIG, []);
        setChatSteps(initialSteps);
      } else {
        console.log('No existing profile data found');
        
        // Initialize chat steps for new user
        const initialSteps = initializeChatSteps(null, {}, REQUIRED_FIELDS_CONFIG, []);
        setChatSteps(initialSteps);
      }
    } catch (error) {
      setError('Failed to check existing profile data.');
      
      // Initialize chat steps even on error
      const initialSteps = initializeChatSteps(null, {}, REQUIRED_FIELDS_CONFIG, []);
      setChatSteps(initialSteps);
    } finally {
      setIsCheckingExistingData(false);
    }
  }, [user?.token, setExistingProfileData, setIsCheckingExistingData, setError, setFormData, setChatSteps]);

  /**
   * Create a new worker profile for the current user
   * This function creates the initial worker profile record in the database
   */
  const createProfile = useCallback(async () => {
    if (!user?.token || workerProfileId) return;

    try {
      const result = await createWorkerProfileAction(user.token);
      if (result.success && result.workerProfileId) {
        setWorkerProfileId(result.workerProfileId);
      }
    } catch (error) {
      setError('Failed to create worker profile.');
    }
  }, [user?.token, workerProfileId]);

  return {
    // State
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    isSubmitting,
    setIsSubmitting,
    currentFocusedInputName,
    setCurrentFocusedInputName,
    existingProfileData,
    setExistingProfileData,
    isCheckingExistingData,
    setIsCheckingExistingData,
    expandedSummaryFields,
    setExpandedSummaryFields,
    isTyping,
    setIsTyping,
    reformulateField,
    setReformulateField,
    isReformulating,
    setIsReformulating,
    error,
    setError,
    isConfirming,
    setIsConfirming,
    confirmedSteps,
    setConfirmedSteps,
    clickedSanitizedButtons,
    setClickedSanitizedButtons,
    unrelatedResponseCount,
    setUnrelatedResponseCount,
    inappropriateContentCount,
    setInappropriateContentCount,
    showHumanSupport,
    setShowHumanSupport,
    supportCaseId,
    setSupportCaseId,
    hashtagState,
    setHashtagState,
    workerProfileId,
    setWorkerProfileId,
    showSetupChoice,
    setShowSetupChoice,
    
    // Helper functions
    resetState,
    checkExistingData,
    createProfile
  };
}
