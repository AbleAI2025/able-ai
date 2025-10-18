/**
 * useOnboardingHandlers.ts
 * 
 * Custom hook that provides all event handlers for the AI onboarding flow.
 * This hook encapsulates all the business logic for handling user interactions,
 * AI processing, data validation, and database operations.
 * 
 * Handlers include:
 * - Input submission and validation
 * - AI content generation and sanitization
 * - Video upload and processing
 * - Profile submission and database operations
 * - Support escalation and error handling
 */

import { useCallback } from 'react';

// Import AI utilities
import { 
  generateAIVideoScript, 
  generateAIProfileSummary,
  checkExistingSimilarSkill,
  interpretJobTitle,
  isUnrelatedResponse,
  generateContextAwarePrompt,
  sanitizeWithAI
} from '../utils/ai-systems/ai-utils';

// Import unified validation system
import { 
  validateUserInput, 
  generateValidationResponse,
  requiresEscalation,
  getEscalationDetails,
  type UnifiedValidationResult,
  type ValidationContext
} from '../utils/validation/unified-validation';

// Import validation and step builders
// Removed checkExistingSkillTitle - no longer checking all workers' skills
import { buildJobTitleConfirmationStep, buildSimilarSkillsConfirmationStep } from '../utils/step-management/step-builders';
import { saveSupportCaseToDatabase } from '../utils/helpers/support-utils';
import { detectEscalationTriggers, generateEscalationDescription } from '@/utils/escalation-detection';

/**
 * Analyze chat steps to determine if escalation is needed based on conversation patterns
 */
const analyzeChatStepsForEscalation = (chatSteps: any[]): { shouldEscalate: boolean; reason: string; confidence: number } => {
  if (chatSteps.length === 0) {
    return { shouldEscalate: false, reason: 'No conversation history', confidence: 0 };
  }

  let escalationScore = 0;
  const reasons: string[] = [];

  // Analyze recent conversation patterns
  const recentSteps = chatSteps.slice(-10); // Last 10 steps
  const userSteps = recentSteps.filter(step => step.type === 'user');
  const botSteps = recentSteps.filter(step => step.type === 'bot');

  // Check for repeated failures or confusion
  const errorPatterns = ['error', 'failed', 'not working', 'confused', 'stuck', 'help'];
  const userInputs = userSteps.map(step => step.content?.toLowerCase() || '').join(' ');
  
  for (const pattern of errorPatterns) {
    if (userInputs.includes(pattern)) {
      escalationScore += 0.2;
      reasons.push(`User mentioned: ${pattern}`);
    }
  }

  // Check for conversation length (long conversations indicate difficulty)
  if (chatSteps.length > 20) {
    escalationScore += 0.3;
    reasons.push(`Long conversation (${chatSteps.length} steps)`);
  }

  // Check for repeated bot responses (AI struggling to understand)
  const botContent = botSteps.map(step => step.content || '').join(' ');
  if (botContent.includes('I don\'t understand') || botContent.includes('Could you clarify')) {
    escalationScore += 0.4;
    reasons.push('AI repeatedly asking for clarification');
  }

  // Check for user frustration indicators
  const frustrationWords = ['frustrated', 'annoying', 'hate', 'terrible', 'awful', 'worst', 'stupid'];
  for (const word of frustrationWords) {
    if (userInputs.includes(word)) {
      escalationScore += 0.5;
      reasons.push(`User frustration detected: ${word}`);
    }
  }

  // Check for explicit help requests
  if (userInputs.includes('help') || userInputs.includes('support') || userInputs.includes('human')) {
    escalationScore += 0.6;
    reasons.push('Explicit help request');
  }

  return {
    shouldEscalate: escalationScore >= 0.7,
    reason: reasons.join('; '),
    confidence: Math.min(escalationScore, 1.0)
  };
};
import { addNextStepSafely } from '../utils/step-management/step-flow';
import { setBio, setSkillName, setExperience, setWage, setAddress, setAvailability, setEquipment, setQualifications, setVideoIntro } from '../utils/fieldsetters';

// Import database actions
import { createWorkerProfileAction, saveWorkerProfileFromOnboardingAction, updateVideoUrlWorkerProfileAction } from '@/actions/user/gig-worker-profile';

// Import profile submission utilities
import { handleProfileSubmission as submitProfileToDatabase } from '../utils/helpers/profile-submission';
import { parseExperienceToNumeric } from '@/lib/utils/experienceParsing';

// Import Firebase storage
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { buildRecommendationLink } from '../utils/helpers/helpers';

/**
 * Custom hook for managing onboarding event handlers
 * @param props - Configuration object containing state and dependencies
 * @returns Object containing all event handler functions
 */
export function useOnboardingHandlers({
  formData,
  setFormData,
  chatSteps,
  setChatSteps,
  user,
  ai,
  requiredFields,
  specialFields,
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
}: any) {

  const handleInputSubmit = useCallback(async (stepId: number, inputName: string, inputValue?: string): Promise<boolean> => {
    const valueToUse = inputValue ?? formData[inputName];
    if (!valueToUse) {
      return false;
    }

    // Mark input step as complete
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.id === stepId ? { ...step, isComplete: true } : step
    ));

    // Check for help commands first
    if (typeof valueToUse === 'string') {
      const trimmedValue = valueToUse.trim().toLowerCase();
      
      // Handle help commands
      if (trimmedValue === '/help' || trimmedValue === 'help' || trimmedValue.startsWith('/help ')) {
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'help',
            isNew: true,
          }
        ]);
        return false;
      }
      
      // Handle manual switch command
      if (trimmedValue === '/manual' || trimmedValue === 'manual' || trimmedValue.startsWith('/manual ')) {
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: 'Switching to manual form...',
            isNew: true,
          }
        ]);
        // Trigger manual form switch via custom event
        const switchEvent = new CustomEvent('switchToManual');
        document.dispatchEvent(switchEvent);
        return false;
      }
      
      // Handle support command
      if (trimmedValue === '/support' || trimmedValue === 'support' || trimmedValue.startsWith('/support ')) {
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'support',
            isNew: true,
          }
        ]);
        return false;
      }
    }

    // DON'T update form data yet - wait until validation passes
    // const updatedFormData = { ...formData, [inputName]: valueToUse };
    // setFormData(updatedFormData);

    // Analyze chat steps for escalation patterns
    const chatAnalysis = analyzeChatStepsForEscalation(chatSteps);
    
    // Check for escalation triggers in user input
    let shouldEscalate = false;
    let escalationReason = '';
    let escalationConfidence = 0;

    if (typeof valueToUse === 'string') {
      const escalationTrigger = detectEscalationTriggers(valueToUse, {
        retryCount: unrelatedResponseCount,
        conversationLength: chatSteps.length,
        userRole: 'worker',
        gigId: undefined
      });

      if (escalationTrigger.shouldEscalate) {
        shouldEscalate = true;
        escalationReason = escalationTrigger.reason;
        escalationConfidence = escalationTrigger.confidence;
      }
    }

    // Also check chat step analysis
    if (chatAnalysis.shouldEscalate) {
      shouldEscalate = true;
      escalationReason = chatAnalysis.reason;
      escalationConfidence = Math.max(escalationConfidence, chatAnalysis.confidence);
    }

    // If escalation is needed, increment unrelated response counter and check if we should stop onboarding
    if (shouldEscalate) {
      const newUnrelatedCount = unrelatedResponseCount + 1;
      setUnrelatedResponseCount(newUnrelatedCount);

      // After 3 unrelated responses, escalate to human support (like old onboarding)
      if (newUnrelatedCount >= 3) {
        const description = `Onboarding stopped after ${newUnrelatedCount} unrelated responses. ${escalationReason}`;
        
        const caseId = await saveSupportCaseToDatabase(
          { userId: user?.uid, formData },
          chatSteps,
          description
        );
        
        setSupportCaseId(caseId);
        setShowHumanSupport(true);
        
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: `I understand you're having trouble with the AI onboarding process. I've created a support case (${caseId}) and our team will be in touch shortly.`,
            isNew: true,
          },
          {
            id: Date.now() + 2,
            type: 'support',
            isNew: true,
          }
        ]);
        
        return false;
      } else {
        // Show warning message for first 2 attempts
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now() + 1,
            type: 'bot',
            content: `I notice you might be having some difficulty. Let me try to help you with this step. If you continue to have trouble, I can connect you with our support team.`,
            isNew: true,
          }
        ]);
        
        // Continue with normal flow but with warning
        return false;
      }
    }

    // Find the previous bot message to check for unrelated responses
    const currentStepIndex = chatSteps.findIndex((s: any) => s.id === stepId);
    const previousBotMessage = chatSteps
      .slice(0, currentStepIndex)
      .reverse()
      .find((s: any) => s.type === 'bot' && s.content);
    
    if (previousBotMessage && previousBotMessage.content) {
      const isUnrelated = await isUnrelatedResponse(valueToUse, previousBotMessage.content, ai);
      
      if (isUnrelated) {
        const newCount = unrelatedResponseCount + 1;
        setUnrelatedResponseCount(newCount);
        
        if (newCount >= 3) {
          // Escalate to human support after 3 unrelated responses
          const caseId = await saveSupportCaseToDatabase(
            { userId: user?.uid, formData },
            chatSteps,
            'Multiple unrelated responses - user struggling with AI onboarding'
          );
          setSupportCaseId(caseId);
          setShowHumanSupport(true);
          
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: 'bot',
              content: `I understand you're having trouble with the AI onboarding process. I've created a support case (${caseId}) and our team will be in touch shortly.`,
              isNew: true,
            },
            {
              id: Date.now() + 2,
              type: 'support',
              isNew: true,
            }
          ]);
          
          return false;
        }
      }
    }


    // Handle different field types
    if (inputName === 'skills' && !formData.jobTitle) {
      // FIRST: Check for inappropriate content BEFORE any processing
      const inappropriateCheck = await enhancedValidation(inputName, valueToUse, 'text');
      if (!inappropriateCheck.sufficient) {
        // Inappropriate content detected - show warning and STOP
        setChatSteps((prev: any[]) => [
          ...prev,
          {
            id: Date.now(),
            type: "bot",
            content: inappropriateCheck.clarificationPrompt || 'Please provide appropriate professional information.',
            isNew: true,
          }
        ]);
        return false; // Stop processing
      }
      
      // Then check user's own similar skills
      const similarSkillsResult = await checkExistingSimilarSkill(valueToUse, workerProfileId || '');
      
      if (similarSkillsResult.exists && similarSkillsResult.similarSkills.length > 0) {
        // User already has this skill, show confirmation step
        setChatSteps((prev: any[]) => [
          ...prev,
          buildSimilarSkillsConfirmationStep(stepId, inputName, valueToUse, similarSkillsResult.similarSkills) as unknown as any,
        ]);
        return false; // Stop processing here
      }
      
      // If no similar skills found, continue with job title interpretation
      const jobTitleResult = await interpretJobTitle(valueToUse, ai);
      
      if (jobTitleResult && jobTitleResult.confidence >= 30) {
        setChatSteps((prev: any[]) => [
          ...prev,
          buildJobTitleConfirmationStep(stepId, inputName, valueToUse, jobTitleResult) as unknown as any,
        ]);
        return true; // Validation passed
      } else {
        // Fall back to enhanced validation for skills field
        try {
          const validationResult = await enhancedValidation(inputName, valueToUse, 'text');
          
          if (validationResult.sufficient && validationResult.sanitized && validationResult.naturalSummary) {
            // Create sanitized confirmation step
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "sanitized",
              fieldName: inputName,
              originalValue: valueToUse,
              sanitizedValue: validationResult.sanitized,
              naturalSummary: validationResult.naturalSummary,
              extractedData: JSON.stringify({ [inputName]: validationResult.sanitized }),
              isComplete: false,
              isNew: true,
            }
          ]);
            return true; // Validation passed
          } else {
          // Show clarification prompt
            setChatSteps((prev: any[]) => [
              ...prev,
              {
                id: Date.now(),
                type: "bot",
                content: validationResult.clarificationPrompt || 'Please provide more information.',
                isNew: true,
              }
            ]);
            return false; // Validation failed
          }
        } catch (error) {
          // Fallback to basic flow
          return false; // Validation failed
        }
      }
    } else if (inputName === 'videoIntro') {
      // Special handling for video field - should not be processed as text input
      return false; // Don't process video field as text input
    } else {
      // For other fields, use enhanced validation to create confirmation steps
      try {
        const validationResult = await enhancedValidation(inputName, valueToUse, 'text');
        
        if (validationResult.sufficient && validationResult.sanitized && validationResult.naturalSummary) {
          // Create sanitized confirmation step
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "sanitized",
              fieldName: inputName,
              originalValue: valueToUse,
              sanitizedValue: validationResult.sanitized,
              naturalSummary: validationResult.naturalSummary,
              extractedData: inputName === 'equipment' ? (validationResult as any).equipment : validationResult.sanitized,
              isComplete: false,
              isNew: true,
            }
          ]);
          return true; // Validation passed
        } else {
          // Show clarification prompt and STOP - don't proceed to next field
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content: validationResult.clarificationPrompt || 'Please provide more information.',
              isNew: true,
            }
          ]);
          return false; // STOP HERE - don't proceed to next field
        }
      } catch (error) {
        // Continue with normal flow as fallback
        return false; // Validation failed
      }
    }
    
    // If we get here, validation passed
    return true;
  }, [formData, setFormData, chatSteps, setChatSteps, user, ai, unrelatedResponseCount, setUnrelatedResponseCount, setShowHumanSupport, setSupportCaseId]);


  const handleSanitizedConfirm = useCallback(async (fieldName: string, sanitized: string | unknown, extractedData?: any) => {
    try {
      setClickedSanitizedButtons((prev: Set<string>) => new Set([...prev, `${fieldName}-confirm`]));
      
      // For equipment field, use the extracted data (array) instead of sanitized string
      let valueToStore = sanitized;
      if (fieldName === 'equipment' && extractedData && Array.isArray(extractedData)) {
        valueToStore = extractedData;
      } else if (fieldName === 'equipment' && !extractedData) {
        // Fallback: parse the sanitized string back to array
        const equipmentItems = String(sanitized).split(', ').map(name => ({ name: name.trim() }));
        valueToStore = equipmentItems;
      }
      
      // Build updated form data with the primary field
      let updatedFormData = { ...formData, [fieldName]: valueToStore };
      
      // If extractedData contains additional fields, merge them in
      if (extractedData && typeof extractedData === 'object' && !Array.isArray(extractedData)) {
        // For skills field, extractedData might contain { skills: ..., experience: ... }
        if (fieldName === 'skills' && extractedData.experience) {
          updatedFormData = { ...updatedFormData, experience: extractedData.experience };
        }
        // For workTraits field (hospitality Phase 5), extractedData contains { workTraits: ..., about: ... }
        // The 'about' is the AI-composed bio from all phases
        if (fieldName === 'workTraits' && extractedData.about) {
          updatedFormData = { ...updatedFormData, about: extractedData.about };
        }
        // For specificSkills field (hospitality Phase 4), just pass through
        if (fieldName === 'specificSkills' && extractedData.about) {
          updatedFormData = { ...updatedFormData, about: extractedData.about };
        }
      }
      
      setFormData(updatedFormData);

      // Mark sanitized step as complete
      setChatSteps((prev: any[]) => prev.map((step: any) => 
        step.type === "sanitized" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
      ));

      // Continue to next step
      await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData, requiredFields, specialFields);
    } catch (error) {
      setError('Failed to confirm. Please try again.');
    }
  }, [formData, setFormData, chatSteps, setChatSteps, setError, setClickedSanitizedButtons, ai, workerProfileId, existingProfileData, requiredFields, specialFields]);

  /**
   * Handle video upload to Firebase Storage
   * Uploads the video file and creates a confirmation step for user review
   */
  const handleVideoUpload = useCallback(async (file: Blob, name?: string, stepId?: number) => {
    try {
      const storage = getStorage(firebaseApp);
      const fileName = `workers/${user?.uid}/introVideo/introduction-${encodeURI(user?.email ?? user?.uid)}.webm`;
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
            await updateVideoUrlWorkerProfileAction(downloadURL, user?.token);
            
            // Update form data
            const updatedFormData = { ...formData, videoIntro: downloadURL };
            setFormData(updatedFormData);

            // Generate AI video script for user guidance
            let aiScript = '';
            try {
              aiScript = await generateAIVideoScript(updatedFormData, ai);
            } catch (scriptError) {
              // AI script generation failed - use default
            }

            // Mark video step as complete and add sanitized confirmation step
            setChatSteps((prev: any[]) => prev.map((step: any) => 
              step.id === stepId ? { ...step, isComplete: true } : step
            ).concat([{
              id: Date.now(),
              type: "sanitized",
              fieldName: "videoIntro",
              sanitizedValue: downloadURL,
              originalValue: "Video uploaded",
              aiScript: aiScript, // Include AI-generated script
              naturalSummary: "I saved the video introduction! 🎥",
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
  }, [formData, setFormData, chatSteps, setChatSteps, user, setError]);

  const handleJobTitleConfirm = useCallback(async (fieldName: string, suggestedJobTitle: string, originalValue: string) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'title' } : step
    ));
    
    // Check if user already has similar skills for this job title
    const similarSkillsResult = await checkExistingSimilarSkill(suggestedJobTitle, workerProfileId || '');
    
    if (similarSkillsResult.exists && similarSkillsResult.similarSkills.length > 0) {
      setChatSteps((prev: any[]) => [
        ...prev,
        buildSimilarSkillsConfirmationStep(Date.now(), fieldName, suggestedJobTitle, similarSkillsResult.similarSkills) as unknown as any,
      ]);
    } else {
      // Use the suggested job title and continue
      const updatedFormData = { ...formData, [fieldName]: suggestedJobTitle };
      setFormData(updatedFormData);
    }
  }, [formData, setFormData, chatSteps, setChatSteps, user]);

  const handleJobTitleReject = useCallback(async (fieldName: string, originalValue: string) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "jobTitleConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'original' } : step
    ));
    
    // Use the original value and continue
    const updatedFormData = { ...formData, [fieldName]: originalValue };
    setFormData(updatedFormData);
  }, [formData, setFormData, chatSteps, setChatSteps]);

  const handleSimilarSkillsUseExisting = useCallback(async (fieldName: string, selectedSkill: any) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "similarSkillsConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'existing' } : step
    ));
    
    // Use the selected existing skill
    const updatedFormData = { ...formData, [fieldName]: selectedSkill.name };
    setFormData(updatedFormData);
  }, [formData, setFormData, chatSteps, setChatSteps]);

  const handleSimilarSkillsAddNew = useCallback(async (fieldName: string, originalValue: string) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "similarSkillsConfirmation" && step.fieldName === fieldName ? { ...step, isComplete: true, confirmedChoice: 'new' } : step
    ));
    
    // Use the original value as a new skill
    const updatedFormData = { ...formData, [fieldName]: originalValue };
    setFormData(updatedFormData);
  }, [formData, setFormData, chatSteps, setChatSteps]);

  const handleSimilarSkillsGoHome = useCallback(() => {
    
    // Navigate to worker profile page
    if (user?.uid) {
      const targetUrl = `/user/${user.uid}/worker`;
      router.push(targetUrl);
    } else {
      // Fallback: try to go back
      router.back();
    }
  }, [router, user?.uid]);

  const handleExistingSkillTitleUseAnyway = useCallback(async (fieldName: string, originalValue: string) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "confirmation" && step.confirmationConfig?.type === "existing-skill-title" && step.confirmationConfig?.fieldName === fieldName ? 
        { ...step, isComplete: true, confirmedChoice: 'use-anyway' } : step
    ));
    
    // Use the original value and continue
    const updatedFormData = { ...formData, [fieldName]: originalValue };
    setFormData(updatedFormData);
  }, [formData, setFormData, chatSteps, setChatSteps]);

  const handleExistingSkillTitleChange = useCallback((fieldName: string) => {
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "confirmation" && step.confirmationConfig?.type === "existing-skill-title" && step.confirmationConfig?.fieldName === fieldName ? 
        { ...step, isComplete: true, confirmedChoice: 'change' } : step
    ));
    
    // Add input step for changing the skill title
    // Add bot message asking for new input instead of input step
    setChatSteps((prev: any[]) => [...prev, {
      id: Date.now(),
      type: "bot",
      content: "Please enter a different skill title...",
      isComplete: true,
      isNew: true,
    }]);
  }, [setChatSteps]);

  const handlePickerConfirm = useCallback(async (stepId: number, inputName: string) => {
    const value = formData[inputName];
    if (!value) {
      setError('Please select a value before confirming.');
      return;
    }

    // Update formData state
    const updatedFormData = { ...formData, [inputName]: value };
    setFormData(updatedFormData);

    // Mark picker step as complete
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.id === stepId ? { ...step, isComplete: true } : step
    ));

    // Continue to next step using the proper flow
    await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData, requiredFields, specialFields);
  }, [formData, setFormData, setChatSteps, setError, ai, chatSteps, workerProfileId, existingProfileData, requiredFields, specialFields]);

  const handleInputChange = useCallback((name: string, value: unknown) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, [setFormData]);

  // ... rest of the code remains the same ...
  const handleSanitizedReformulate = useCallback((fieldName: string) => {
    setReformulateField(fieldName);
    setClickedSanitizedButtons((prev: Set<string>) => new Set([...prev, `${fieldName}-reformulate`]));
  }, [setReformulateField, setClickedSanitizedButtons]);

  const handleSanitizedConfirmation = useCallback(async (fieldName: string, sanitizedValue: string) => {
    // For location fields, preserve the original object with coordinates
    let valueToStore = sanitizedValue;
    if (fieldName === 'location') {
      // Find the original step to get the original location object
      const originalStep = chatSteps.find((step: any) => 
        step.type === "sanitized" && step.fieldName === fieldName
      );
      if (originalStep && originalStep.originalValue && typeof originalStep.originalValue === 'object') {
        // Use the original location object with coordinates
        valueToStore = originalStep.originalValue;
      }
    }
    
    // Update form data with the appropriate value
    setFormData((prev: any) => ({ ...prev, [fieldName]: valueToStore }));
    
    // Mark sanitized step as complete
    setChatSteps((prev: any[]) => prev.map((step: any) => 
      step.type === "sanitized" && step.fieldName === fieldName ? 
        { ...step, isComplete: true } : step
    ));
    
    // Continue to next step
    const updatedFormData = { ...formData, [fieldName]: valueToStore };
    await addNextStepSafely(updatedFormData, ai, chatSteps, setChatSteps, workerProfileId, existingProfileData, requiredFields, specialFields);
  }, [formData, setFormData, setChatSteps, ai, chatSteps, workerProfileId, existingProfileData, requiredFields, specialFields]);

  const handleIncidentReporting = useCallback(async (message: string) => {
    try {
      // Implementation for incident reporting
    } catch (error) {
      setError('Failed to report incident. Please try again.');
    }
  }, [setError]);

  const onSendMessage = useCallback((message: string) => {
    // Handle user message sending
  }, []);

  const enhancedValidation = useCallback(async (field: string, value: unknown, type: string): Promise<{ sufficient: boolean, clarificationPrompt?: string, sanitized?: string | unknown, naturalSummary?: string, extractedData?: string }> => {
    
    if (!value) {
      return { 
        sufficient: false, 
        clarificationPrompt: 'Please provide some information so I can help you create the perfect worker profile!'
      };
    }

    const trimmedValue = String(value).trim();
    
    // Create analysis context for enhanced validation
    const analysisContext: ValidationContext = {
      currentStep: field,
      currentField: field,
      conversationLength: chatSteps.length,
      retryCount: unrelatedResponseCount,
      userRole: 'worker',
      previousMessages: chatSteps.filter((step: any) => step.type === 'user').map((step: any) => step.content || '').slice(-5)
    };
    
    try {
      // Special handling for qualifications skip responses
      if (field === 'qualifications') {
        const skipKeywords = ['none', 'n/a', 'na', 'skip', 'no qualifications', 'no certs', 'no certifications', 'don\'t have any', 'don\'t have', 'no formal', 'no official', 'nothing', 'not applicable', 'not relevant', 'no training', 'no education'];
        const hasSkipKeywords = skipKeywords.some(keyword => trimmedValue.toLowerCase().includes(keyword));
        
        if (hasSkipKeywords) {
          // Bypass all validation for qualifications skip responses
          return {
            sufficient: true,
            sanitized: 'No formal qualifications',
            naturalSummary: 'Got it! You don\'t have any formal qualifications.',
            extractedData: 'No formal qualifications'
          };
        }
      }
      
      // 1. ENHANCED INPUT VALIDATION (AI + Hardcoded patterns)
      const validation = await validateUserInput(trimmedValue, analysisContext, ai);
      
      
      // 2. CHECK FOR HELP REQUESTS OR SUPPORT NEEDS
      if (validation.isHelpRequest || validation.needsSupport) {
        const response = generateValidationResponse(validation, analysisContext);
        return {
          sufficient: false,
          clarificationPrompt: response,
          sanitized: trimmedValue
        };
      }
      
      // 3. CHECK FOR INAPPROPRIATE CONTENT
      if (validation.isInappropriate) {
        // Increment inappropriate content counter for escalation
        const newInappropriateCount = inappropriateContentCount + 1;
        setInappropriateContentCount(newInappropriateCount);
        
        // After 3 inappropriate responses, escalate using old onboarding escalation system
        if (newInappropriateCount >= 3) {
          const description = `Onboarding stopped after ${newInappropriateCount} inappropriate content responses. ${validation.reason}`;
          
          // Use the same escalation system as old onboarding
          const caseId = await saveSupportCaseToDatabase(
            { userId: user?.uid, formData },
            chatSteps,
            description
          );
          
          setSupportCaseId(caseId);
          setShowHumanSupport(true);
          
          // Use the same escalation message format as old onboarding
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: 'escalation',
              message: `I've detected multiple inappropriate responses. I'm connecting you with human support to help you complete your profile professionally.`,
              isNew: true,
            }
          ]);
          
          return {
            sufficient: false,
            clarificationPrompt: `I've detected inappropriate content. After multiple inappropriate responses, I'm connecting you with human support to help you complete your profile professionally.`,
            sanitized: trimmedValue
          };
        }
        
        const response = generateValidationResponse(validation, analysisContext);
        return {
          sufficient: false,
          clarificationPrompt: response,
          sanitized: trimmedValue
        };
      }
      
            // Debug: Check if validation failed for other reasons
            if (!validation.isValid) {
              // STOP HERE - Don't proceed with sanitization if validation failed
              const response = generateValidationResponse(validation, analysisContext);
              return {
                sufficient: false,
                clarificationPrompt: response,
                sanitized: trimmedValue
              };
            }
      
      // 4. CHECK FOR ESCALATION NEEDS (skip for equipment and hourlyRate fields)
      if (!['equipment', 'hourlyRate', 'wage'].includes(field) && requiresEscalation(validation)) {
        const escalationDetails = getEscalationDetails(validation, analysisContext, trimmedValue);
        
        // TODO: Implement escalation handling (save to database, notify support team)
        return {
          sufficient: false,
          clarificationPrompt: `I've detected that you might need additional support. ${validation.reason}`,
          sanitized: trimmedValue
        };
      }
      
      // 5. AI-POWERED SANITIZATION (if input passed enhanced validation)
      let aiSanitizedResult: any = null;
      try {
        aiSanitizedResult = await sanitizeWithAI(field, trimmedValue);
      } catch (aiError) {
        // AI sanitization failed - use original value
      }

      // 6. FIELD-SPECIFIC VALIDATION (if input passed enhanced validation)
      let validationResult: any = { ok: false };
      
      // Use AI-sanitized value if available, otherwise use original trimmed value
      const valueForFieldSetter = aiSanitizedResult?.sanitized || trimmedValue;
      
      // Route to appropriate field setter based on field name
      switch (field) {
              case 'about':
                validationResult = setBio(valueForFieldSetter, {
                  retryCount: unrelatedResponseCount,
                  conversationLength: chatSteps.length,
                  userRole: 'worker'
                });
                break;
              case 'skills':
                validationResult = await setSkillName(valueForFieldSetter, ai);
                break;
        case 'experience':
          validationResult = setExperience(valueForFieldSetter);
          break;
        case 'hourlyRate':
          validationResult = setWage(valueForFieldSetter);
          // Store the wage amount as the field value
          if (validationResult.ok && validationResult.wage) {
            validationResult[field] = String(validationResult.wage.amount);
          }
          break;
        case 'location':
          validationResult = setAddress(value);
          break;
        case 'availability':
          validationResult = setAvailability(value);
          break;
        case 'equipment':
          validationResult = await setEquipment(valueForFieldSetter, ai);
          break;
        case 'qualifications':
          validationResult = setQualifications(valueForFieldSetter);
          break;
        case 'videoIntro':
          validationResult = setVideoIntro(value);
          break;
        default:
          // Fallback to basic validation for unknown fields
          const fallbackSummary = (() => {
            switch (field) {
              case 'about': return `Perfect! "${trimmedValue}" - that sounds great!`;
              case 'skills': return `Got it! You're skilled in ${trimmedValue}.`;
              case 'experience': return `Excellent! ${trimmedValue} experience is valuable.`;
              case 'qualifications': return trimmedValue.toLowerCase().includes('no formal') || trimmedValue.toLowerCase().includes('none') 
            ? `Got it! No formal qualifications needed.`
            : `Nice! ${trimmedValue} - those are good qualifications.`;
              case 'equipment': return `Great! You have ${trimmedValue} ready to go.`;
              case 'hourlyRate': return `Perfect! £${trimmedValue} per hour is a good rate.`;
              case 'location': return `Awesome! ${trimmedValue} is a great location.`;
              case 'availability': return `Excellent! ${trimmedValue} works well.`;
              default: return `Perfect! "${trimmedValue}" - that's great!`;
            }
          })();
          
          return {
            sufficient: true,
            sanitized: aiSanitizedResult?.sanitized || validation.sanitizedInput || trimmedValue,
            naturalSummary: aiSanitizedResult?.naturalSummary || fallbackSummary,
            extractedData: aiSanitizedResult?.sanitized || validation.sanitizedInput || trimmedValue
          };
      }

      // Check if field-specific validation failed
      if (!validationResult.ok) {
        return {
          sufficient: false,
          clarificationPrompt: validationResult.error || 'Please provide valid information.',
          sanitized: validation.sanitizedInput || trimmedValue
        };
      }

      // Check if support is needed in field-specific validation
      if (validationResult.needsSupport) {
        return {
          sufficient: false,
          clarificationPrompt: validationResult.supportMessage || 'Support assistance needed.',
          sanitized: validation.sanitizedInput || trimmedValue
        };
      }

      // Handle equipment field specially (it's now an array)
      let sanitizedValue;
      let extractedData;
      
      if (field === 'equipment' && (validationResult as any).equipment && (validationResult as any).equipment.length > 0) {
        // Convert equipment array to string for display
        sanitizedValue = (validationResult as any).equipment.map((item: any) => item.name).join(', ');
        // Store the original array for database storage
        extractedData = (validationResult as any).equipment;
      } else if (field === 'equipment' && (validationResult as any).equipment && (validationResult as any).equipment.length === 0) {
        // Handle empty equipment array (none responses)
        sanitizedValue = 'No equipment';
        extractedData = (validationResult as any).equipment; // Empty array
      } else if (field === 'location' && (validationResult as any).location) {
        // Handle location field specially - use formatted_address if available
        const location = (validationResult as any).location;
        sanitizedValue = location.formatted_address || `${location.lat}, ${location.lng}`;
        extractedData = location; // Store the full location object
      } else if (field === 'experience' && (validationResult as any).experienceText) {
        // Handle experience field specially - use parsed experience text
        sanitizedValue = (validationResult as any).experienceText;
        extractedData = {
          experienceText: (validationResult as any).experienceText,
          years: (validationResult as any).years || 0,
          months: (validationResult as any).months || 0
        };
      } else {
        // Use the appropriate field value - prioritize field setter results over AI sanitization
        sanitizedValue = validationResult[field] || 
          validationResult.bio || 
          validationResult.skillName || 
          validationResult.experienceText || 
          (validationResult.wage ? String(validationResult.wage.amount) : null) || 
          validationResult.address || 
          validationResult.location || 
          validationResult.availability || 
          aiSanitizedResult?.sanitized || 
          validation.sanitizedInput || 
          trimmedValue;
        
        console.log('🔍 Field setter result:', validationResult);
        console.log('🔍 Final sanitized value:', sanitizedValue);
        extractedData = sanitizedValue;
      }

      // Return successful validation with AI enhancement
      const fallbackSummary = (() => {
        // Use sanitized value for better natural summaries
        const displayValue = sanitizedValue || trimmedValue;
        switch (field) {
          case 'about': return `Perfect! "${displayValue}" - that sounds great!`;
          case 'skills': return `Got it! You're a ${displayValue}.`;
          case 'experience': return `Excellent! ${displayValue} level experience is valuable.`;
          case 'qualifications': return displayValue.toLowerCase().includes('no formal') || displayValue.toLowerCase().includes('none') 
            ? `Got it! No formal qualifications needed.`
            : `Nice! ${displayValue} - those are great qualifications.`;
          case 'equipment': return `Great! You have ${displayValue} ready to go.`;
          case 'hourlyRate': return `Perfect! £${displayValue} per hour is a good rate.`;
          case 'location': return `Awesome! ${displayValue} is a great location.`;
          case 'availability': return `Excellent! ${displayValue} works well.`;
          default: return `Perfect! "${displayValue}" - that's great!`;
        }
      })();
      
      const naturalSummary = aiSanitizedResult?.naturalSummary || fallbackSummary;
      console.log('🔍 Natural summary being used:', naturalSummary);
      console.log('🔍 AI sanitized result natural summary:', aiSanitizedResult?.naturalSummary);
      
      return {
        sufficient: true,
        sanitized: sanitizedValue,
        naturalSummary: naturalSummary,
        extractedData: extractedData
      };
    } catch (error) {
      console.error('Enhanced validation error:', error);
      const fallbackSummary = (() => {
        // Use sanitized value for better natural summaries
        const displayValue = trimmedValue;
        switch (field) {
          case 'about': return `Perfect! "${displayValue}" - that sounds great!`;
          case 'skills': return `Got it! You're a ${displayValue}.`;
          case 'experience': return `Excellent! ${displayValue} level experience is valuable.`;
          case 'qualifications': return displayValue.toLowerCase().includes('no formal') || displayValue.toLowerCase().includes('none') 
            ? `Got it! No formal qualifications needed.`
            : `Nice! ${displayValue} - those are great qualifications.`;
          case 'equipment': return `Great! You have ${displayValue} ready to go.`;
          case 'hourlyRate': return `Perfect! £${displayValue} per hour is a good rate.`;
          case 'location': return `Awesome! ${displayValue} is a great location.`;
          case 'availability': return `Excellent! ${displayValue} works well.`;
          default: return `Perfect! "${displayValue}" - that's great!`;
        }
      })();
      
      return {
        sufficient: true,
        sanitized: trimmedValue,
        naturalSummary: fallbackSummary,
        extractedData: trimmedValue
      };
    }
  }, [ai, setError, unrelatedResponseCount, chatSteps.length]);

  const handleManualFormSubmit = useCallback(async (formData: any) => {
    try {
      if (!user?.token) {
        throw new Error('User not authenticated');
      }

      // Import the database action directly
      const { saveWorkerProfileFromOnboardingAction } = await import('@/actions/user/gig-worker-profile');
      
      // Ensure all required fields are properly formatted
      const submissionData = {
        ...formData,
        hourlyRate: String(formData.hourlyRate || ''),
        about: formData.about || '',
        experience: formData.experience || '',
        skills: formData.skills || '',
        qualifications: formData.qualifications || '',
        equipment: typeof formData.equipment === 'string' 
          ? formData.equipment.split(/[,\n;]/).map((item: string) => ({ name: item.trim(), description: undefined })).filter((item: { name: string; description: undefined }) => item.name.length > 0)
          : formData.equipment || [],
        location: typeof formData.location === 'string' ? formData.location : JSON.stringify(formData.location || {}),
        availability: typeof formData.availability === 'string' ? formData.availability : JSON.stringify(formData.availability || []),
        videoIntro: formData.videoIntro || '',
        references: formData.references || '',
        jobTitle: formData.jobTitle || formData.skills || '',
        experienceYears: formData.experienceYears || 0,
        experienceMonths: formData.experienceMonths || 0
      };
      
      const result = await saveWorkerProfileFromOnboardingAction(submissionData, user.token);
      
      if (result.success) {
        // Use router for client-side navigation instead of window.location.href
        router.push(`/user/${user.uid}/worker/profile`);
        return { success: true, message: 'Profile saved successfully!' };
      } else {
        throw new Error(result.error || 'Failed to save profile');
      }
    } catch (error) {
      console.error('Error in handleManualFormSubmit:', error);
      setError('Failed to save profile. Please try again.');
      throw error;
    }
  }, [user, setError, router]);

  const hasActiveStepForField = useCallback((fieldName: string) => {
    return chatSteps.some((step: any) => 
      (step.type === 'input' || step.type === 'sanitized' || step.type === 'confirmation' || 
       step.type === 'jobTitleConfirmation' || step.type === 'similarSkillsConfirmation') &&
      step.fieldName === fieldName && 
      !step.isComplete
    );
  }, [chatSteps]);

  const getNextRequiredField = useCallback((formData: any) => {
    // Check if user already has location and availability data
    const hasLocationAndAvailability = !!(formData.location && formData.availability);
    
    if (hasLocationAndAvailability) {
      // Skip location and availability fields if user already has them
      return requiredFields.find((f: any) => !formData[f.name] && f.name !== 'location' && f.name !== 'availability');
    }
    
    return requiredFields.find((f: any) => !formData[f.name]);
  }, [requiredFields]);

  const isActiveInputStep = useCallback((step: any, idx: number) => {
    const lastIncompleteInputStep = chatSteps
      .filter((s: any) => (s.type === 'input' || s.type === 'calendar' || s.type === 'location') && !s.isComplete)
      .pop();
    
    return step.id === lastIncompleteInputStep?.id;
  }, [chatSteps]);

  const handleSetupChoice = useCallback((choice: 'ai' | 'manual') => {
    // Simplified version - can be expanded later
    console.log('Setup choice:', choice);
  }, []);

  const handleSwitchToAI = useCallback(() => {
    // Simplified version - can be expanded later
    console.log('Switch to AI');
  }, []);

  const handleResetChoice = useCallback(() => {
    // Simplified version - can be expanded later
    console.log('Reset choice');
  }, []);

  const handleProfileSubmission = useCallback(async (summaryData: any) => {
    if (!user?.token) {
      setError('Authentication required. Please sign in again.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Parse experience to get numeric values
      const experienceText = summaryData?.experience || formData.experience || '';
      const { years: experienceYears, months: experienceMonths } = parseExperienceToNumeric(experienceText);
      
      // Generate AI profile summary
      let aiProfileSummary = '';
      try {
        aiProfileSummary = await generateAIProfileSummary(summaryData, ai);
      } catch (summaryError) {
        console.error('AI profile summary generation failed:', summaryError);
      }
      
      const requiredData = {
        about: summaryData?.about || formData.about || '',
        experience: summaryData?.experience || formData.experience || '',
        skills: summaryData?.skills || formData.skills || '',
        qualifications: (() => {
          const quals = summaryData?.qualifications || formData.qualifications || '';
          if (typeof quals === 'string') {
            const qualsLower = quals.toLowerCase().trim();
            // Check for "none" patterns - return null to not submit anything
            if (qualsLower === 'none' ||
                qualsLower.includes('no qualifications') ||
                qualsLower.includes('no formal') ||
                qualsLower.includes("don't have") ||
                qualsLower.includes("i don't") ||
                qualsLower === 'n/a') {
              return undefined;
            }
            // Remove any prefixes like "Qualifications:" that might have been added by AI
            return quals.replace(/^Qualifications\s*:\s*/i, '').trim();
          }
          return quals;
        })(),
        equipment: (() => {
          const equip = summaryData?.equipment || formData.equipment;
          
          // If already an array, return as-is
          if (Array.isArray(equip)) {
            return equip;
          }
          
          // If string, check for "none" patterns
          if (typeof equip === 'string') {
            const equipLower = equip.toLowerCase().trim();
            // Check for "none" patterns - return null to not submit anything
            if (equipLower === 'none' || 
                equipLower.includes('no equipment') ||
                equipLower.includes("don't have") ||
                equipLower.includes("i don't") ||
                equipLower === 'n/a') {
              return undefined;
            }
            
            // Convert comma-separated string to array
            if (equip.trim().length > 0) {
              return equip.split(/[,\n;]/)
                .map((item: string) => item.trim())
                .filter((item: string) => item.length > 0)
                .map((item: string) => ({ 
                  name: item.charAt(0).toUpperCase() + item.slice(1), 
                  description: undefined 
                }));
            }
          }
          
          return [];
        })(),
        hourlyRate: (() => {
          const rateValue = summaryData?.hourlyRate || formData.hourlyRate || '';
          if (typeof rateValue === 'string') {
            // Extract numeric value from formatted strings like "Hourly Rate: \"35\""
            const numMatch = rateValue.match(/(\d+(?:\.\d+)?)/);
            return numMatch ? numMatch[1] : rateValue;
          }
          return String(rateValue);
        })(),
        location: summaryData?.location || formData.location || '',
        availability: summaryData?.availability || formData.availability || { 
          days: [], 
          startTime: '09:00', 
          endTime: '17:00',
          frequency: 'weekly',
          ends: 'never',
          startDate: new Date().toISOString().split('T')[0],
          endDate: undefined,
          occurrences: undefined
        },
        videoIntro: summaryData?.videoIntro || formData.videoIntro || '',
        references: summaryData?.references || formData.references || '',
        jobTitle: summaryData?.jobTitle || formData.jobTitle || '',
        experienceYears: experienceYears,
        experienceMonths: experienceMonths
      };
      
      // Use the profile submission utility
      await submitProfileToDatabase(requiredData, user.token, user.uid, setChatSteps, setWorkerProfileId, setError, router, ai);
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, setError, setIsSubmitting, setChatSteps, setWorkerProfileId, router, ai]);

  return {
    handleInputSubmit,
    handleSanitizedConfirm,
    handleVideoUpload,
    handleJobTitleConfirm,
    handleJobTitleReject,
    handleSimilarSkillsUseExisting,
    handleSimilarSkillsAddNew,
    handleSimilarSkillsGoHome,
    handlePickerConfirm,
    handleInputChange,
    handleSanitizedReformulate,
    handleSanitizedConfirmation,
    handleIncidentReporting,
    onSendMessage,
    enhancedValidation,
    handleManualFormSubmit,
    hasActiveStepForField,
    getNextRequiredField,
    isActiveInputStep,
    handleSetupChoice,
    handleSwitchToAI,
    handleResetChoice,
    handleExistingSkillTitleUseAnyway,
    handleExistingSkillTitleChange,
    handleProfileSubmission
  };
}