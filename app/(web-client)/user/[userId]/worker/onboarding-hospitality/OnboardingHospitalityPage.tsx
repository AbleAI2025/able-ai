/**
 * OnboardingHospitalityPage.tsx
 * 
 * Hospitality onboarding using the existing onboarding-ai engine.
 * Only customizes prompts and light data mapping for hospitality context.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useFirebase } from '@/context/FirebaseContext';

// Import existing onboarding components and hooks
import OnboardingRenderer from '../onboarding-ai/components/OnboardingRenderer';
import { useOnboardingState } from '../onboarding-ai/hooks/useOnboardingState';
import { useOnboardingHandlers } from '../onboarding-ai/hooks/useOnboardingHandlers';
import { useOnboardingEffects } from '../onboarding-ai/hooks/useOnboardingEffects';

// Import hospitality-specific configuration
import { 
  requiredFields as HOSPITALITY_REQUIRED_FIELDS, 
  specialFields as HOSPITALITY_SPECIAL_FIELDS,
  parseExperienceFromSkills
} from './config/questions.hospitality';

// Import AI utilities for generating composed about
import { generateAIProfileSummary } from '../onboarding-ai/utils/ai-systems/ai-utils';
import { addNextStepSafely } from '../onboarding-ai/utils/step-management/step-flow';

// Import database actions
import { saveWorkerProfileFromOnboardingAction } from '@/actions/user/gig-worker-profile';
import { checkExistingProfileDataAction } from '@/actions/user/check-existing-profile-data-action';
import { parseExperienceToNumeric } from '@/lib/utils/experienceParsing';

// Import styles
import styles from './OnboardingHospitalityPage.module.css';

/**
 * Main OnboardingHospitalityPage Component
 */
export default function OnboardingHospitalityPage() {
  const { user, loading: loadingAuth } = useAuth();
  const { ai } = useFirebase();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  // Use existing onboarding state for standard fields
  const onboardingState = useOnboardingState(user);
  const {
    // Core engine state
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
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
    // helper funcs
    checkExistingData,
    createProfile,
    showSetupChoice,
    setShowSetupChoice
  } = onboardingState;

  // Local setup mode to mirror onboarding-ai
  const [setupMode, setSetupMode] = useState<'ai' | 'manual'>('ai');
  
  // Track hospitality-specific accumulated data
  const [hospitalityData, setHospitalityData] = useState({
    venueExperience: '',
    specificSkills: '',
    workTraits: ''
  });

  // Use existing onboarding handlers with hospitality configuration
  const handlers = useOnboardingHandlers({
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    user,
    ai,
    requiredFields: HOSPITALITY_REQUIRED_FIELDS,
    specialFields: HOSPITALITY_SPECIAL_FIELDS,
    unrelatedResponseCount,
    setUnrelatedResponseCount,
    inappropriateContentCount,
    setInappropriateContentCount,
    setShowHumanSupport,
    setSupportCaseId,
    clickedSanitizedButtons,
    setClickedSanitizedButtons,
    reformulateField,
    setReformulateField,
    setIsReformulating,
    setError,
    setIsSubmitting,
    setHashtagState,
    hashtagState,
    workerProfileId,
    setWorkerProfileId,
    router,
    existingProfileData
  });

  // Completely replace checkExistingData to clear bio BEFORE initializing steps
  const checkExistingDataHospitality = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      setIsCheckingExistingData(true);
      const result = await checkExistingProfileDataAction(user.token);
      
      if (result.success && result.data) {
        // Clear bio flags BEFORE setting existingProfileData
        const cleanedData = { ...result.data };
        cleanedData.hasFullBio = false; // Critical: This prevents the confirmation prompt
        
        if (cleanedData.profileData) {
          const profileData = cleanedData.profileData as any;
          delete profileData.fullBio;
          delete profileData.about;
          delete profileData.bio;
        }
        
        setExistingProfileData(cleanedData);
        
        // Initialize form data (empty, to force 6-phase flow)
        const existingFormData: any = {};
        setFormData(existingFormData);
        
        // Create custom hospitality chat steps - start directly with Phase 1
        const initialSteps = [
          {
            id: Date.now(),
            type: "bot" as const,
            content: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Phase 1: Skills question
            isComplete: true,
            isNew: true,
          },
          {
            id: Date.now() + 1,
            type: "input" as const,
            inputConfig: {
              type: HOSPITALITY_REQUIRED_FIELDS[0].type,
              name: HOSPITALITY_REQUIRED_FIELDS[0].name,
              placeholder: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Use prompt as placeholder for display
              rows: HOSPITALITY_REQUIRED_FIELDS[0].rows
            },
            isComplete: false,
            isNew: true,
          }
        ];
        setChatSteps(initialSteps);
      } else {
        // Create custom hospitality chat steps for new user - start directly with Phase 1
        const initialSteps = [
          {
            id: Date.now(),
            type: "bot" as const,
            content: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Phase 1: Skills question
            isComplete: true,
            isNew: true,
          },
          {
            id: Date.now() + 1,
            type: "input" as const,
            inputConfig: {
              type: HOSPITALITY_REQUIRED_FIELDS[0].type,
              name: HOSPITALITY_REQUIRED_FIELDS[0].name,
              placeholder: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Use prompt as placeholder for display
              rows: HOSPITALITY_REQUIRED_FIELDS[0].rows
            },
            isComplete: false,
            isNew: true,
          }
        ];
        setChatSteps(initialSteps);
      }
    } catch (error) {
      setError('Failed to check existing profile data.');
      
      // Create custom hospitality chat steps even on error
      const initialSteps = [
        {
          id: Date.now(),
          type: "bot" as const,
          content: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Phase 1: Skills question
          isComplete: true,
          isNew: true,
        },
        {
          id: Date.now() + 1,
          type: "input" as const,
          inputConfig: {
            type: HOSPITALITY_REQUIRED_FIELDS[0].type,
            name: HOSPITALITY_REQUIRED_FIELDS[0].name,
            placeholder: HOSPITALITY_REQUIRED_FIELDS[0].defaultPrompt, // Use prompt as placeholder for display
            rows: HOSPITALITY_REQUIRED_FIELDS[0].rows
          },
          isComplete: false,
          isNew: true,
        }
      ];
      setChatSteps(initialSteps);
    } finally {
      setIsCheckingExistingData(false);
    }
  }, [user?.token, setIsCheckingExistingData, setExistingProfileData, setFormData, setChatSteps, setError]);

  // Wire onboarding effects with wrapped checkExistingData
  useOnboardingEffects({
    user,
    chatSteps,
    isTyping,
    error,
    setError,
    reformulateField,
    isReformulating,
    setReformulateField,
    setIsReformulating,
    formData,
    setFormData,
    setChatSteps,
    requiredFields: HOSPITALITY_REQUIRED_FIELDS,
    checkExistingData: checkExistingDataHospitality, // Use wrapped version
    createProfile,
    endOfChatRef,
    setSetupMode,
    setShowSetupChoice,
  });

  // Wrap handleSanitizedConfirm to handle hospitality-specific field mappings
  const handleSanitizedConfirm = useCallback(async (fieldName: string, sanitizedValue: any, extractedData?: any) => {
    try {
      // Handle Phase 1: Skills field - parse experience if present
      if (fieldName === 'skills') {
        // Get the original user input from the last user message in chat steps
        const lastUserMessage = [...chatSteps].reverse().find((step: any) => step.type === 'user');
        const originalInput = lastUserMessage?.content || sanitizedValue;
        
        // Parse experience from the ORIGINAL input (before AI sanitization)
        const parsed = parseExperienceFromSkills(originalInput);
        
        // Prepare extracted data with experience for the handler
        const skillsExtractedData = parsed.experience ? {
          skills: sanitizedValue,
          experience: parsed.experience
        } : { skills: sanitizedValue };
        
        // Continue to next step via standard handler - pass experience via extractedData
        await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, skillsExtractedData);
      }
    // Handle Phase 2: About (venue experience) - first time, store directly
    else if (fieldName === 'about' && !hospitalityData.venueExperience) {
      setHospitalityData(prev => ({ ...prev, venueExperience: sanitizedValue }));
      // Don't set formData here - let handlers.handleSanitizedConfirm do it to avoid race condition
      await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
    }
    // Handle Phase 3: Qualifications
    else if (fieldName === 'qualifications') {
      await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
    }
    // Handle Phase 4: specificSkills - append to 'about'
    else if (fieldName === 'specificSkills') {
      setHospitalityData(prev => ({ ...prev, specificSkills: sanitizedValue }));
      const updatedAbout = formData.about ? `${formData.about}\n\n${sanitizedValue}` : sanitizedValue;
      setFormData((prev: any) => ({ ...prev, about: updatedAbout }));
      await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
    }
    // Handle Phase 5: workTraits - append to 'about' and compose final version with AI
    else if (fieldName === 'workTraits') {
      setHospitalityData(prev => ({ ...prev, workTraits: sanitizedValue }));
      
      // Build complete about from all phases
      const aboutParts = [
        hospitalityData.venueExperience,
        hospitalityData.specificSkills,
        sanitizedValue
      ].filter(Boolean);
      
      // Show "Able is thinking..." message while AI composes
      setIsTyping(true);
      setChatSteps((prev: any[]) => [
        ...prev,
        {
          id: Date.now(),
          type: "typing" as const,
          content: "Able is thinking...",
          isComplete: false,
          isNew: true
        }
      ]);
      
      // Try to compose with AI for better flow
      try {
        const composedAbout = await generateAIProfileSummary({
          about: aboutParts.join('\n\n'),
          qualifications: formData.qualifications,
          skills: formData.skills
        } as any, ai);
        
        // Remove thinking message
        setIsTyping(false);
        setChatSteps((prev: any[]) => prev.filter(step => step.type !== "typing"));
        
        setFormData((prev: any) => ({ ...prev, about: composedAbout }));
        await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
      } catch (error) {
        console.error('AI composition failed, using concatenated version:', error);
        
        // Remove thinking message
        setIsTyping(false);
        setChatSteps((prev: any[]) => prev.filter(step => step.type !== "typing"));
        
        // Fallback: simple concatenation
        const fallbackAbout = aboutParts.join('\n\n');
        setFormData((prev: any) => ({ ...prev, about: fallbackAbout }));
        await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
      }
    }
      // Standard field handling for all other fields
      else {
        await handlers.handleSanitizedConfirm(fieldName, sanitizedValue, extractedData);
      }
    } catch (error) {
      throw error;
    }
  }, [formData, setFormData, handlers, ai, hospitalityData, setHospitalityData, chatSteps, setChatSteps, setIsTyping]);

  // Use the standard handlers for video and profile submission
  const handleVideoUpload = handlers.handleVideoUpload;
  
  // ... rest of the code remains the same ...
  // Wrap handleInputSubmit to show thinking message during validation
  const handleInputSubmit = useCallback(async (stepId: number, inputName: string, inputValue?: string): Promise<boolean> => {
    // Show thinking message while AI validates/checks existing skills
    setIsTyping(true);
    const thinkingStepId = Date.now();
    setChatSteps((prev: any[]) => [
      ...prev,
      {
        id: thinkingStepId,
        type: "typing" as const,
        content: "Able is thinking...",
        isComplete: false,
        isNew: true
      }
    ]);
    
    try {
      // Call the actual handler
      const result = await handlers.handleInputSubmit(stepId, inputName, inputValue);
      
      // Remove thinking message
      setIsTyping(false);
      setChatSteps((prev: any[]) => prev.filter(step => step.id !== thinkingStepId));
      
      return result;
    } catch (error) {
      // Remove thinking message on error
      setIsTyping(false);
      setChatSteps((prev: any[]) => prev.filter(step => step.id !== thinkingStepId));
      throw error;
    }
  }, [handlers, setIsTyping, setChatSteps]);

  // Custom onSendMessage that submits to the current active input step or field
  const onSendMessage = useCallback((message: string) => {
    // Find the active input step (last incomplete input step)
    const activeInputStep = chatSteps.find((step: any) => 
      step.type === 'input' && !step.isComplete
    );
    
    if (activeInputStep && activeInputStep.inputConfig?.name) {
      const fieldName = activeInputStep.inputConfig.name;
      
      // This prevents inappropriate content from being saved before validation
      
      // Add user message bubble to chat
      setChatSteps((prev: any[]) => [
        ...prev,
        {
          id: Date.now(),
          type: "user" as const,
          content: message,
          isComplete: true,
          isNew: true
        }
      ]);
      
      // Submit the input - validation will update formData if appropriate
      handleInputSubmit(activeInputStep.id, fieldName, message);
    } else {
      // No input step - check if we're waiting for 'about' field (venue experience)
      // This happens when the bot asks a question but doesn't show a textarea
      if (formData.skills && !formData.about) {
        // This prevents inappropriate content from being saved before validation
        
        // Add user message bubble to chat
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now(),
            type: "user" as const,
            content: message,
            isComplete: true,
            isNew: true
          }
        ]);
        
        // Submit the input for 'about' field - validation will update formData if appropriate
        handleInputSubmit(Date.now(), 'about', message);
      } else {
        // No active field - but still process through validation for inappropriate content
        // Add user message bubble to chat
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now(),
            type: "user" as const,
            content: message,
            isComplete: true,
            isNew: true
          }
        ]);
        
        // Still call handleInputSubmit with a generic field to trigger validation
        // This ensures escalation/inappropriate content detection still works
        handleInputSubmit(Date.now(), 'message', message);
      }
    }
  }, [chatSteps, formData, setFormData, setChatSteps, handleInputSubmit]);
  
  const handleJobTitleConfirm = handlers.handleJobTitleConfirm;
  const handleJobTitleReject = handlers.handleJobTitleReject;
  const handleSimilarSkillsUseExisting = handlers.handleSimilarSkillsUseExisting;
  const handleSimilarSkillsAddNew = handlers.handleSimilarSkillsAddNew;
  const handleSimilarSkillsGoHome = handlers.handleSimilarSkillsGoHome;
  const handlePickerConfirm = handlers.handlePickerConfirm;
  const handleSanitizedReformulate = handlers.handleSanitizedReformulate;
  const handleSanitizedConfirmation = handlers.handleSanitizedConfirmation;
  const handleExistingSkillTitleUseAnyway = handlers.handleExistingSkillTitleUseAnyway;
  const handleExistingSkillTitleChange = handlers.handleExistingSkillTitleChange;
  
  // Handle profile submission with experience parsing
  const handleProfileSubmission = useCallback(async (summaryData?: any) => {
    const dataToSubmit = summaryData || formData;
    
    // Parse experience to numeric if present
    if (dataToSubmit.experience) {
      const parsed = parseExperienceToNumeric(dataToSubmit.experience);
      dataToSubmit.experienceYears = parsed.years;
      dataToSubmit.experienceMonths = parsed.months;
    }
    
    // Handle "none" responses - convert to null
    if (dataToSubmit.qualifications && typeof dataToSubmit.qualifications === 'string') {
      const qualLower = dataToSubmit.qualifications.toLowerCase().trim();
      if (qualLower === 'none' || 
          qualLower.includes('no qualifications') ||
          qualLower.includes("don't have") ||
          qualLower.includes("i don't") ||
          qualLower === 'n/a') {
        dataToSubmit.qualifications = null;
      }
    }
    
    // Handle equipment - convert to array format or null if "none"
    if (dataToSubmit.equipment) {
      if (typeof dataToSubmit.equipment === 'string') {
        const equipLower = dataToSubmit.equipment.toLowerCase().trim();
        if (equipLower === 'none' || 
            equipLower.includes('no equipment') ||
            equipLower.includes("don't have") ||
            equipLower.includes("i don't") ||
            equipLower === 'n/a') {
          dataToSubmit.equipment = null;
        } else {
          // Convert comma-separated string to array
          const equipmentArray = dataToSubmit.equipment
            .split(',')
            .map((item: string) => item.trim())
            .filter((item: string) => item.length > 0)
            .map((item: string) => ({
              name: item.charAt(0).toUpperCase() + item.slice(1),
              description: undefined
            }));
          dataToSubmit.equipment = equipmentArray;
        }
      }
    }
    
    // Use the standard profile submission
    await handlers.handleProfileSubmission(dataToSubmit);
  }, [formData, handlers]);

  // Handle input change
  const handleInputChange = useCallback((name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, [setFormData]);

  // Handle manual form submit using standard handler
  const handleManualFormSubmit = handlers.handleManualFormSubmit;

  // Handle using existing data (e.g., "Use this location")
  const handleUseExistingData = useCallback(async (fieldName: string, existingValue: string) => {
    // Mark confirmation step as complete
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "confirmation" && step.confirmationConfig?.fieldName === fieldName ? 
        { ...step, isComplete: true, confirmedChoice: 'use' } : step
    ));
    
    // Update form data with existing value
    setFormData((prev: any) => ({ ...prev, [fieldName]: existingValue }));
    
    // Continue to next step
    const updatedFormData = { ...formData, [fieldName]: existingValue };
    await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData, HOSPITALITY_REQUIRED_FIELDS, HOSPITALITY_SPECIAL_FIELDS);
  }, [formData, setFormData, setChatSteps, ai, chatSteps, workerProfileId, existingProfileData]);

  // Handle editing existing data (e.g., "Edit")
  const handleEditExistingData = useCallback((fieldName: string) => {
    console.log('🔍 handleEditExistingData called:', { fieldName });
    
    // Mark confirmation step as complete
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "confirmation" && step.confirmationConfig?.fieldName === fieldName ? 
        { ...step, isComplete: true, confirmedChoice: 'edit' } : step
    ));
    
    // Add appropriate step based on field type
    const fieldConfig = HOSPITALITY_REQUIRED_FIELDS.find(f => f.name === fieldName);
    if (fieldConfig) {
      if (fieldConfig.type === "location" || fieldName === "location") {
        // For location, add the location picker step
        setChatSteps((prev: any[]) => [...prev, {
          id: Date.now(),
          type: "location",
          isComplete: false,
          isNew: true,
        }]);
      } else if (fieldConfig.type === "availability" || fieldName === "availability") {
        // For availability, add the availability picker step
        setChatSteps((prev: any[]) => [...prev, {
          id: Date.now(),
          type: "availability",
          isComplete: false,
          isNew: true,
        }]);
      } else if (fieldConfig.type === "video" || fieldName === "videoIntro") {
        // For video, add the video recorder step
        setChatSteps((prev: any[]) => [...prev, {
          id: Date.now(),
          type: "video",
          isComplete: false,
          isNew: true,
        }]);
      } else {
        // For text fields, add bot message asking for new input
        setChatSteps((prev: any[]) => [...prev, {
          id: Date.now(),
          type: "bot",
          content: fieldConfig.defaultPrompt,
          isComplete: true,
          isNew: true,
        }]);
      }
    }
  }, [setChatSteps]);

  // Check if a special component is currently active (location, calendar, video, confirmations, etc.)
  const isSpecialComponentActive = useMemo(() => {
    const currentStep = chatSteps.find(step => 
      (step.type === "calendar" || step.type === "location" || step.type === "video" || 
       step.type === "confirmation" || step.type === "sanitized" || step.type === "jobTitleConfirmation" ||
       step.type === "similarSkillsConfirmation" || step.type === "support" || step.type === "typing" ||
       step.type === "availability") && !step.isComplete
    );
    return !!currentStep;
  }, [chatSteps]);

  // Loading state
  if (loadingAuth) {
    return (
      <div className={styles.hospitalityContainer}>
        <div className={styles.hospitalityHeader}>
          <div className={styles.hospitalityLogo}>Able AI</div>
          <div className={styles.hospitalitySubtitle}>Loading...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div ref={chatContainerRef}>
      <OnboardingRenderer
        chatSteps={chatSteps}
        formData={formData}
        // Setup/engine UI parity with onboarding-ai
        setupMode={setupMode}
        setSetupMode={setSetupMode}
        showSetupChoice={showSetupChoice}
        setShowSetupChoice={setShowSetupChoice}
        isReportingIncident={false}
        manualFormData={{}}
        setManualFormData={() => {}}
        handleInputSubmit={handleInputSubmit}
        handleInputChange={handleInputChange}
        handleSanitizedConfirm={handleSanitizedConfirm}
        handleSanitizedReformulate={handleSanitizedReformulate}
        handleSanitizedConfirmation={handleSanitizedConfirm}
        handleVideoUpload={handleVideoUpload}
        handleProfileSubmission={handleProfileSubmission}
        handleManualFormSubmit={handleManualFormSubmit}
        handleUseExistingData={handleUseExistingData}
        handleEditExistingData={handleEditExistingData}
        handleExistingSkillTitleUseAnyway={handleExistingSkillTitleUseAnyway}
        handleExistingSkillTitleChange={handleExistingSkillTitleChange}
        handleJobTitleConfirm={handleJobTitleConfirm}
        handleJobTitleReject={handleJobTitleReject}
        handleSimilarSkillsUseExisting={handleSimilarSkillsUseExisting}
        handleSimilarSkillsAddNew={handleSimilarSkillsAddNew}
        handleSimilarSkillsGoHome={handleSimilarSkillsGoHome}
        handlePickerConfirm={handlePickerConfirm}
        handleSwitchToAI={() => setSetupMode('ai')}
        handleResetChoice={() => setShowSetupChoice(true)}
        onSendMessage={onSendMessage}
        setFormData={setFormData}
        setChatSteps={setChatSteps}
        ai={ai}
        workerProfileId={workerProfileId}
        chatContainerRef={chatContainerRef}
        endOfChatRef={endOfChatRef}
        isSubmitting={isSubmitting}
        error={error}
        isTyping={isTyping}
        reformulateField={reformulateField}
        clickedSanitizedButtons={clickedSanitizedButtons}
        supportCaseId={supportCaseId}
        hashtagState={hashtagState}
        existingProfileData={existingProfileData}
        isCheckingExistingData={isCheckingExistingData}
        isConfirming={isConfirming}
        confirmedSteps={confirmedSteps}
        user={user}
        isSpecialComponentActive={isSpecialComponentActive}
      />
      <div ref={endOfChatRef} />
      {error && (
        <div style={{ color: '#e53e3e', padding: '1rem', background: '#fed7d7', borderRadius: '0.5rem', margin: '1rem' }}>
          {error}
        </div>
      )}
    </div>
  );
}
