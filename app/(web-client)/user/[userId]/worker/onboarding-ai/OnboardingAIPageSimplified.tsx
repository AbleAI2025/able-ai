/**
 * OnboardingAIPageSimplified.tsx
 *
 * Main component for the AI-powered worker onboarding flow.
 * This is a modularized version of the original onboarding that provides:
 * - Chat-based interface for collecting worker profile data
 * - AI-powered content validation and sanitization
 * - Existing data confirmation flow
 * - Skill validation and similar skills detection
 * - Video upload and availability scheduling
 * - Complete database integration
 *
 * The component orchestrates multiple custom hooks and utilities to provide
 * a seamless onboarding experience that matches the old onboarding functionality.
 */

"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useFirebase } from "@/context/FirebaseContext";

// Import modularized utilities and components
import { useOnboardingState } from "./hooks/useOnboardingState";
import { useOnboardingHandlers } from "./hooks/useOnboardingHandlers";
import { useOnboardingEffects } from "./hooks/useOnboardingEffects";
import OnboardingRenderer from "./components/OnboardingRenderer";

// Import step flow utilities for managing the conversational flow
import {
  handleJobTitleConfirmation,
  handleJobTitleRejection,
  handleSimilarSkillsUseExisting,
  handleSimilarSkillsAddNew,
  handleSanitizedConfirmation,
  getNextRequiredField,
  addNextStepSafely,
} from "./utils/step-management/step-flow";

// Import profile submission utilities for database operations
import { handleManualFormSubmission } from "./utils/helpers/profile-submission";

// Import AI utilities for content generation and validation
import {
  requiredFields as REQUIRED_FIELDS_CONFIG,
  specialFields as SPECIAL_FIELDS_CONFIG,
} from "./utils/step-management/questions";

// Import Firebase storage for video uploads
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { toast } from "sonner";

// Type definitions
interface RequiredField {
  name: string;
  type: string;
  placeholder?: string;
  defaultPrompt: string;
  rows?: number;
}

interface FormData {
  about?: string;
  experience?: string;
  skills?: string;
  qualifications?: string;
  equipment?: string;
  hourlyRate?: number;
  location?: { lat: number; lng: number } | string;
  availability?:
    | {
        days: string[];
        startTime: string;
        endTime: string;
        frequency?: string;
        ends?: string;
        startDate?: string;
        endDate?: string;
        occurrences?: number;
      }
    | string;
  videoIntro?: string;
  references?: string;
  jobTitle?: string;
  [key: string]: any;
}

const requiredFields: RequiredField[] = REQUIRED_FIELDS_CONFIG;
const specialFields: RequiredField[] = SPECIAL_FIELDS_CONFIG;

/**
 * Main OnboardingAIPageSimplified Component
 *
 * This component provides a complete AI-powered onboarding experience for workers.
 * It manages the entire flow from initial data collection to final profile submission.
 */
export default function OnboardingAIPageSimplified() {
  const { user, loading: loadingAuth } = useAuth();
  const { ai } = useFirebase();
  const router = useRouter();
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const endOfChatRef = useRef<HTMLDivElement | null>(null);

  // Use custom hooks for state management
  const onboardingState = useOnboardingState(user);
  const {
    // Core form and chat state
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    isSubmitting,
    setIsSubmitting,
    // Existing data management
    existingProfileData,
    isCheckingExistingData,

    // UI state management
    isTyping,
    reformulateField,
    setReformulateField,
    isReformulating,
    setIsReformulating,

    // Error and confirmation handling
    error,
    setError,
    isConfirming,
    confirmedSteps,
    clickedSanitizedButtons,
    setClickedSanitizedButtons,

    // Support and escalation
    unrelatedResponseCount,
    setUnrelatedResponseCount,
    inappropriateContentCount,
    setInappropriateContentCount,
    setShowHumanSupport,
    supportCaseId,
    setSupportCaseId,

    // Hashtag generation
    hashtagState,
    setHashtagState,

    // Profile management
    workerProfileId,
    setWorkerProfileId,
    showSetupChoice,
    setShowSetupChoice,

    // Utility functions
    resetState,
    checkExistingData,
    createProfile,
  } = onboardingState;

  // Additional state for simplified component
  const [setupMode, setSetupMode] = useState<"ai" | "manual">("ai");
  const [manualFormData, setManualFormData] = useState<FormData>({});
  const [isReportingIncident, setIsReportingIncident] = useState(false);
  // Check if a special component is currently active (location, calendar, video recording, AI validations, support, etc.)
  const isSpecialComponentActive = useMemo(() => {
    const currentStep = chatSteps.find(
      (step) =>
        (step.type === "calendar" ||
          step.type === "location" ||
          step.type === "video" ||
          step.type === "confirmation" ||
          step.type === "sanitized" ||
          step.type === "jobTitleConfirmation" ||
          step.type === "similarSkillsConfirmation" ||
          step.type === "support" ||
          step.type === "typing") &&
        !step.isComplete
    );
    return !!currentStep;
  }, [chatSteps]);

  // Use custom hooks for handlers and effects
  const handlers = useOnboardingHandlers({
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    user,
    ai,
    requiredFields,
    specialFields,
    getNextRequiredField: (data: FormData) => getNextRequiredField(data),
    addNextStepSafely: async (data: FormData, aiService: any) => {
      // This would be implemented using the step-flow utilities
      // Implementation handled by step-flow utilities
    },
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
    existingProfileData,
  });

  // Destructure handlers (no longer using enhanced validation)

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
    requiredFields,
    checkExistingData,
    createProfile,
    endOfChatRef,
    setSetupMode,
    setShowSetupChoice,
  });

  // Enhanced handlers using extracted utilities
  /**
   * Handle input submission for chat steps
   * Processes user input and moves to the next step in the onboarding flow
   * Now uses enhanced validation system with AI responses
   */
  const handleInputSubmit = useCallback(
    async (
      stepId: number,
      inputName: string,
      inputValue?: string
    ): Promise<boolean> => {
      // Use the proper handleInputSubmit from hooks which includes similar skill checks
      const validationPassed: boolean = await handlers.handleInputSubmit(
        stepId,
        inputName,
        inputValue
      );

      return validationPassed;
    },
    [handlers.handleInputSubmit]
  );

  /**
   * Handle sanitized content confirmation
   * Processes AI-sanitized content and continues the flow
   */
  const handleSanitizedConfirm = useCallback(
    async (fieldName: string, sanitized: string | unknown) => {
      await handleSanitizedConfirmation(
        fieldName,
        sanitized,
        formData,
        setFormData,
        chatSteps,
        setChatSteps,
        ai,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      chatSteps,
      setChatSteps,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

  /**
   * Handle job title confirmation
   * Processes user confirmation of AI-suggested job title
   */
  const handleJobTitleConfirm = useCallback(
    async (
      fieldName: string,
      suggestedJobTitle: string,
      originalValue: string
    ) => {
      await handleJobTitleConfirmation(
        fieldName,
        suggestedJobTitle,
        originalValue,
        formData,
        setFormData,
        chatSteps,
        setChatSteps,
        user,
        ai,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      chatSteps,
      setChatSteps,
      user,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleJobTitleReject = useCallback(
    async (fieldName: string, originalValue: string) => {
      await handleJobTitleRejection(
        fieldName,
        originalValue,
        formData,
        setFormData,
        chatSteps,
        setChatSteps,
        ai,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      chatSteps,
      setChatSteps,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleSimilarSkillsUseExistingCallback = useCallback(
    async (fieldName: string, selectedSkill: any) => {
      await handleSimilarSkillsUseExisting(
        fieldName,
        selectedSkill,
        formData,
        setFormData,
        chatSteps,
        setChatSteps,
        ai,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      chatSteps,
      setChatSteps,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleSimilarSkillsAddNewCallback = useCallback(
    async (fieldName: string, originalValue: string) => {
      await handleSimilarSkillsAddNew(
        fieldName,
        originalValue,
        formData,
        setFormData,
        chatSteps,
        setChatSteps,
        ai,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      chatSteps,
      setChatSteps,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

const handleVideoUpload = useCallback(
  async (file: Blob, skillName?: string, stepId?: number) => {
    const toastId = toast.loading("Uploading video...");

    try {
      if (!user) throw new Error("Error: user not found, you must be logged in");

      const storage = getStorage(firebaseApp);

      const baseName = skillName
        ? encodeURIComponent(skillName)
        : "introduction";

      const fileName = `workers/${
        user?.uid
      }/introVideo/${baseName}-${encodeURIComponent(
        user?.email ?? user?.uid
      )}.webm`;

      const storageReference = storageRef(storage, fileName);

      const uploadTask = uploadBytesResumable(storageReference, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Track upload progress and update toast
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          toast.loading(`Uploading: ${Math.round(progress)}%`, {
            id: toastId,
          });
        },
        (error) => {
          console.error("Upload failed:", error);
          setError("Video upload failed. Please try again.");
          toast.error("Video upload failed. Please try again.", { id: toastId });
        },
        async () => {
          try {
            // Get the download URL after upload completes
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Update video URL in profile
            if (!user?.token) {
              throw new Error("Authentication token is required");
            }

              // Update form data
            const updatedFormData = { ...formData, videoIntro: downloadURL };
            setFormData(updatedFormData);

            // Update chat steps:
            // - mark the current video step as complete
            // - add a sanitized confirmation step with extracted data
            setChatSteps((prev: any[]) =>
              prev
                .map((step: any) =>
                  step.id === stepId ? { ...step, isComplete: true } : step
                )
                .concat([
                  {
                    id: Date.now(),
                    type: "sanitized",
                    fieldName: "videoIntro",
                    sanitizedValue: downloadURL,
                    originalValue: "Video uploaded",
                    naturalSummary: "I saved the video introduction! 🎥",
                    extractedData: JSON.stringify({ videoIntro: downloadURL }),
                    isComplete: false,
                    isNew: true,
                  },
                ])
            );

            // Show success toast
            toast.success("Video uploaded successfully!", { id: toastId });
          } catch (error) {
            console.error("Error getting download URL:", error);
            setError("Failed to save video. Please try again.");
            toast.error("Failed to save video. Please try again.", { id: toastId });
          }
        }
      );
    } catch (error) {
      console.error("Video upload error:", error);
      setError("Video upload failed. Please try again.");
      toast.error("Video upload failed. Please try again.", { id: toastId });
    }
  },
  [
    formData,
    setFormData,
    chatSteps,
    setChatSteps,
    user,
    setError,
    existingProfileData,
  ]
);

  const handleInputChange = useCallback(
    (name: string, value: unknown) => {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    },
    [setFormData]
  );

  const handleSanitizedReformulate = useCallback(
    (fieldName: string) => {
      setReformulateField(fieldName);
      setClickedSanitizedButtons(
        (prev: Set<string>) => new Set([...prev, `${fieldName}-reformulate`])
      );
    },
    [setReformulateField, setClickedSanitizedButtons]
  );

  const handlePickerConfirm = useCallback(
    async (stepId: number, inputName: string) => {
      const value = formData[inputName];
      if (!value) {
        setError("Please select a value before confirming.");
        return;
      }

      // Mark picker step as complete
      setChatSteps((prev: any[]) =>
        prev.map((step: any) =>
          step.id === stepId ? { ...step, isComplete: true } : step
        )
      );

      // Continue to next step using the proper flow
      const updatedFormData = { ...formData, [inputName]: value };
      await addNextStepSafely(
        updatedFormData,
        ai,
        chatSteps,
        setChatSteps,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      setChatSteps,
      setError,
      ai,
      chatSteps,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleManualFormSubmit = useCallback(
    async (formData: any) => {
      await handleManualFormSubmission(
        formData,
        user?.token || "",
        user?.uid || "",
        setError,
        setIsSubmitting,
        router,
        ai
      );
    },
    [user, setError, setIsSubmitting, router, ai]
  );

  const handleSwitchToAI = useCallback(() => {
    setSetupMode("ai");
    setShowSetupChoice(false);
  }, [setShowSetupChoice]);

  const handleResetChoice = useCallback(() => {
    setSetupMode("ai");
    setShowSetupChoice(false);
    resetState();
  }, [setShowSetupChoice, resetState]);

  const handleSimilarSkillsGoHome = useCallback(() => {
    // Navigate to worker profile page
    router.push(`/user/${user?.uid}/worker`);
  }, [router, user?.uid]);

  const handleUseExistingData = useCallback(
    async (fieldName: string, existingValue: string) => {
      // Mark confirmation step as complete and set confirmed choice
      setChatSteps((prev: any[]) =>
        prev.map((step: any) =>
          step.type === "confirmation" &&
          step.confirmationConfig?.fieldName === fieldName
            ? { ...step, isComplete: true, confirmedChoice: "use" }
            : step
        )
      );

      // Update form data with existing value
      setFormData((prev: any) => ({ ...prev, [fieldName]: existingValue }));

      // Continue to next step
      const updatedFormData = { ...formData, [fieldName]: existingValue };
      await addNextStepSafely(
        updatedFormData,
        ai,
        chatSteps,
        setChatSteps,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      setChatSteps,
      ai,
      chatSteps,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleEditExistingData = useCallback(
    (fieldName: string) => {
      // Mark confirmation step as complete and set confirmed choice
      setChatSteps((prev: any[]) =>
        prev.map((step: any) =>
          step.type === "confirmation" &&
          step.confirmationConfig?.fieldName === fieldName
            ? { ...step, isComplete: true, confirmedChoice: "edit" }
            : step
        )
      );

      // Add appropriate step based on field type
      const fieldConfig = requiredFields.find((f) => f.name === fieldName);
      if (fieldConfig) {
        if (fieldConfig.type === "availability") {
          // For availability, add the availability input step
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "availability",
              isComplete: false,
              isNew: true,
            },
          ]);
        } else if (fieldConfig.type === "location") {
          // For location, add the location input step
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "location",
              isComplete: false,
              isNew: true,
            },
          ]);
        } else if (fieldConfig.type === "video") {
          // For video, add the video input step
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "video",
              isComplete: false,
              isNew: true,
            },
          ]);
        } else {
          // For text fields, add bot message asking for new input
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now(),
              type: "bot",
              content: fieldConfig.defaultPrompt,
              isComplete: true,
              isNew: true,
            },
          ]);
        }
      }
    },
    [setChatSteps, requiredFields]
  );

  const handleExistingSkillTitleUseAnyway = useCallback(
    async (fieldName: string, originalValue: string) => {
      // Update form data with original value
      setFormData((prev: any) => ({ ...prev, [fieldName]: originalValue }));

      // Mark confirmation step as complete
      setChatSteps((prev: any[]) =>
        prev.map((step: any) =>
          step.type === "confirmation" &&
          step.confirmationConfig?.type === "existing-skill-title" &&
          step.confirmationConfig?.fieldName === fieldName
            ? { ...step, isComplete: true }
            : step
        )
      );

      // Continue to next step
      const updatedFormData = { ...formData, [fieldName]: originalValue };
      await addNextStepSafely(
        updatedFormData,
        ai,
        chatSteps,
        setChatSteps,
        workerProfileId,
        existingProfileData
      );
    },
    [
      formData,
      setFormData,
      setChatSteps,
      ai,
      chatSteps,
      workerProfileId,
      existingProfileData,
    ]
  );

  const handleExistingSkillTitleChange = useCallback(
    (fieldName: string) => {
      // Mark confirmation step as complete
      setChatSteps((prev: any[]) =>
        prev.map((step: any) =>
          step.type === "confirmation" &&
          step.confirmationConfig?.type === "existing-skill-title" &&
          step.confirmationConfig?.fieldName === fieldName
            ? { ...step, isComplete: true }
            : step
        )
      );

      // Add input step for changing the skill title
      // Add bot message asking for new input instead of input step
      setChatSteps((prev: any[]) => [
        ...prev,
        {
          id: Date.now(),
          type: "bot",
          content: "Please enter a different skill title...",
          isComplete: true,
          isNew: true,
        },
      ]);
    },
    [setChatSteps]
  );

  const onSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      // Add user message to chat
      const userMessageStep = {
        id: Date.now(),
        type: "user" as const,
        content: message.trim(),
        isNew: true,
      };

      setChatSteps((prev: any[]) => [...prev, userMessageStep]);

      // Check if there's an active input step
      const activeInputStep = chatSteps.find(
        (step: any) =>
          (step.type === "input" ||
            step.type === "calendar" ||
            step.type === "location" ||
            step.type === "availability") &&
          !step.isComplete
      );

      if (activeInputStep && activeInputStep.inputConfig) {
        // Process the message as input for the active step
        const fieldName = activeInputStep.inputConfig.name;

        // Submit the input first, then update form data only if validation passes
        const validationPassed = await handleInputSubmit(
          activeInputStep.id,
          fieldName,
          message.trim()
        );

        if (validationPassed) {
          // Only update form data if validation passed
          setFormData((prev: any) => ({
            ...prev,
            [fieldName]: message.trim(),
          }));
        }
      } else {
        // No active input step, start the onboarding flow with the user's message
        const nextField = getNextRequiredField(formData, existingProfileData);

        if (nextField) {
          // Process the input using enhanced validation system first
          const validationPassed = await handleInputSubmit(
            Date.now(),
            nextField.name,
            message.trim()
          );

          if (validationPassed) {
            // Only update form data if validation passed
            setFormData((prev: any) => ({
              ...prev,
              [nextField.name]: message.trim(),
            }));
          }
        } else {
          // All fields completed, show completion message
          setChatSteps((prev: any[]) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "bot",
              content:
                "🎉 Perfect! Your worker profile is now complete. You're all set to start finding gigs!",
              isNew: true,
            },
          ]);
        }
      }
    },
    [
      chatSteps,
      formData,
      setFormData,
      setChatSteps,
      handleInputSubmit,
      getNextRequiredField,
      ai,
      workerProfileId,
      existingProfileData,
    ]
  );

  // Show loading state
  if (loadingAuth) {
    return <div>Loading...</div>;
  }

  // Show error if no user
  if (!user) {
    return <div>Please sign in to continue.</div>;
  }

  return (
    <OnboardingRenderer
      // State
      chatSteps={chatSteps}
      formData={formData}
      isSubmitting={isSubmitting}
      error={error}
      isTyping={isTyping}
      isReportingIncident={isReportingIncident}
      setupMode={setupMode}
      showSetupChoice={showSetupChoice}
      isCheckingExistingData={isCheckingExistingData}
      existingProfileData={existingProfileData}
      manualFormData={manualFormData}
      hashtagState={hashtagState}
      clickedSanitizedButtons={clickedSanitizedButtons}
      reformulateField={reformulateField}
      confirmedSteps={confirmedSteps}
      isConfirming={isConfirming}
      supportCaseId={supportCaseId}
      // Refs
      chatContainerRef={chatContainerRef}
      endOfChatRef={endOfChatRef}
      // Handlers
      handleInputSubmit={handleInputSubmit}
      handleInputChange={handleInputChange}
      handleSanitizedConfirm={handleSanitizedConfirm}
      handleSanitizedReformulate={handleSanitizedReformulate}
      handleSanitizedConfirmation={handlers.handleSanitizedConfirmation}
      setFormData={setFormData}
      setChatSteps={setChatSteps}
      ai={ai}
      workerProfileId={workerProfileId}
      handleVideoUpload={handleVideoUpload}
      handleJobTitleConfirm={handleJobTitleConfirm}
      handleJobTitleReject={handleJobTitleReject}
      handleSimilarSkillsUseExisting={handleSimilarSkillsUseExistingCallback}
      handleSimilarSkillsAddNew={handleSimilarSkillsAddNewCallback}
      handleSimilarSkillsGoHome={handleSimilarSkillsGoHome}
      handlePickerConfirm={handlePickerConfirm}
      handleManualFormSubmit={handleManualFormSubmit}
      handleSwitchToAI={handleSwitchToAI}
      handleResetChoice={handleResetChoice}
      onSendMessage={onSendMessage}
      handleUseExistingData={handleUseExistingData}
      handleEditExistingData={handleEditExistingData}
      handleExistingSkillTitleUseAnyway={handleExistingSkillTitleUseAnyway}
      handleExistingSkillTitleChange={handleExistingSkillTitleChange}
      handleProfileSubmission={handlers.handleProfileSubmission}
      // Other props
      user={user}
      setSetupMode={setSetupMode}
      setShowSetupChoice={setShowSetupChoice}
      setManualFormData={setManualFormData}
      isSpecialComponentActive={isSpecialComponentActive}
    />
  );
}
