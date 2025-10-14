/**
 * OnboardingRenderer.tsx
 * 
 * Main renderer component for the AI onboarding flow.
 * This component handles the rendering of all chat steps, forms, and interactive elements
 * in the onboarding process. It provides a unified interface for displaying different
 * types of steps including text inputs, confirmations, special components, and more.
 */

import React from 'react';
import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import ManualProfileForm from "@/app/components/onboarding/ManualProfileForm";
import SetupChoiceModal from "@/app/components/onboarding/SetupChoiceModal";
import Loader from "@/app/components/shared/Loader";

// Import all step renderers for different chat step types
import { 
  renderTypingStep, 
  renderShareLinkStep, 
  renderCalendarStep, 
  renderLocationStep, 
  renderVideoStep, 
  renderInputStep, 
  renderSummaryStep, 
  renderAvailabilityStep, 
  renderJobTitleConfirmationStep, 
  renderSimilarSkillsConfirmationStep, 
  renderHashtagGenerationStep, 
  renderConfirmationStep, 
  renderExistingSkillTitleConfirmationStep, 
  renderSanitizedConfirmationStep,
  renderHelpStep
} from './renderers/StepRenderers';

// Import specialized components
import IncidentBanner from './IncidentBanner';
import SupportOptions from './SupportOptions';
import AIVideoScriptDisplay from './AIVideoScriptDisplay';

// Import styles
import pageStyles from '../OnboardingAIPage.module.css';
import styles from '../OnboardingAIPage.module.css';

/**
 * Props interface for the OnboardingRenderer component
 * Contains all the state and handler functions needed to render the onboarding flow
 */
export interface OnboardingRendererProps {
  // Core state
  chatSteps: any[];                    // Array of chat steps to render
  formData: any;                       // Current form data
  isSubmitting: boolean;               // Whether currently submitting
  error: string | null;                // Current error message
  isTyping: boolean;                   // Whether AI is typing
  isReportingIncident: boolean;        // Whether reporting an incident
  setupMode: 'ai' | 'manual';          // Current setup mode
  showSetupChoice: boolean;            // Whether to show setup choice modal
  isCheckingExistingData: boolean;     // Whether checking for existing data
  existingProfileData: any;            // Existing profile data if found
  manualFormData: any;                 // Manual form data
  hashtagState: any;                   // Hashtag generation state
  clickedSanitizedButtons: Set<string>; // Tracked sanitized button clicks
  reformulateField: string | null;     // Field being reformulated
  // Confirmation and support state
  confirmedSteps: Set<number>;          // Steps that have been confirmed
  isConfirming: boolean;               // Whether currently confirming
  supportCaseId: string | null;        // Support case ID if escalated
  
  // Refs for DOM manipulation
  chatContainerRef: React.RefObject<HTMLDivElement | null>;  // Chat container ref
  endOfChatRef: React.RefObject<HTMLDivElement | null>;      // End of chat ref
  
  // Event handlers
  handleInputSubmit: (stepId: number, inputName: string, inputValue?: string) => void;
  handleInputChange: (name: string, value: unknown) => void;
  handleSanitizedConfirm: (fieldName: string, sanitized: string | unknown) => void;
  handleSanitizedReformulate: (fieldName: string) => void;
  handleSanitizedConfirmation: (fieldName: string, sanitizedValue: string) => Promise<void>;
  setFormData: (data: any | ((prev: any) => any)) => void;
  setChatSteps: (steps: any[] | ((prev: any[]) => any[])) => void;
  ai: any;                            // AI service instance
  workerProfileId: string | null;     // Worker profile ID
  
  // Specialized handlers
  handleVideoUpload: (file: Blob, name?: string, stepId?: number) => void;
  handleJobTitleConfirm: (fieldName: string, suggestedJobTitle: string, originalValue: string) => void;
  handleJobTitleReject: (fieldName: string, originalValue: string) => void;
  handleSimilarSkillsUseExisting: (fieldName: string, selectedSkill: any) => void;
  handleSimilarSkillsAddNew: (fieldName: string, originalValue: string) => void;
  handleSimilarSkillsGoHome: () => void;
  handlePickerConfirm: (stepId: number, inputName: string) => void;
  handleManualFormSubmit: (formData: any) => void;
  handleSwitchToAI: () => void;
  handleResetChoice: () => void;
  onSendMessage: (message: string) => void;
  handleUseExistingData: (fieldName: string, existingValue: string) => Promise<void>;
  handleEditExistingData: (fieldName: string) => void;
  handleExistingSkillTitleUseAnyway: (fieldName: string, originalValue: string) => Promise<void>;
  handleExistingSkillTitleChange: (fieldName: string) => void;
  handleProfileSubmission: (summaryData: any) => Promise<void>;
  
  // Other props
  user: any;
  setSetupMode: (mode: 'ai' | 'manual') => void;
  setShowSetupChoice: (show: boolean) => void;
  setManualFormData: (data: any) => void;
  isSpecialComponentActive: boolean;
}

/**
 * Main OnboardingRenderer Component
 * 
 * Renders the complete onboarding interface including:
 * - Chat steps and messages
 * - Input forms and confirmations
 * - Special components (calendar, location, video)
 * - Manual form fallback
 * - Setup choice modal
 * - Support and incident reporting
 */
export default function OnboardingRenderer({
  // Core state
  chatSteps,
  formData,
  isSubmitting,
  error,
  isReportingIncident,
  setupMode,
  showSetupChoice,
  isCheckingExistingData,
  existingProfileData,
  manualFormData,
  hashtagState,
  isConfirming,
  supportCaseId,
  
  // Refs
  chatContainerRef,
  endOfChatRef,
  
  // Event handlers
  handleInputSubmit,
  handleInputChange,
  handleSanitizedReformulate,
  handleSanitizedConfirmation,
  setChatSteps,
  ai,
  workerProfileId,
  handleVideoUpload,
  handleJobTitleConfirm,
  handleJobTitleReject,
  handleSimilarSkillsUseExisting,
  handleSimilarSkillsAddNew,
  handleSimilarSkillsGoHome,
  handlePickerConfirm,
  handleManualFormSubmit,
  handleSwitchToAI,
  handleResetChoice,
  onSendMessage,
  handleUseExistingData,
  handleEditExistingData,
  handleExistingSkillTitleUseAnyway,
  handleExistingSkillTitleChange,
  handleProfileSubmission,
  setSetupMode,
  setShowSetupChoice,
  setManualFormData,
  isSpecialComponentActive
}: OnboardingRendererProps) {

  const DEFAULT_SKILL_NAME = "default"
  
  // Show loading state
  if (isCheckingExistingData) {
    return (
      <div className={pageStyles.container}>
        <Loader />
      </div>
    );
  }

  // Setup choice handler
  const handleSetupChoice = (choice: 'ai' | 'manual') => {
    setSetupMode(choice);
    setShowSetupChoice(false);
    
    if (choice === 'manual') {
      // Initialize manual form with any existing data
      setManualFormData(formData);
    }
  };

  // Show setup choice modal if no mode has been selected
  if (showSetupChoice) {
    return (
      <SetupChoiceModal
        isOpen={showSetupChoice}
        onChoice={handleSetupChoice}
      />
    );
  }

  // Show manual form
  if (setupMode === 'manual') {
    return (
      <div className={pageStyles.container}>
        <div className={styles.manualFormContainer}>
          <div className={styles.manualFormHeader}>
            <h2>Manual Profile Setup</h2>
            <button
              onClick={handleResetChoice}
              className={styles.changeSetupButton}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" fill="currentColor"/>
              </svg>
              Change Setup Method
            </button>
          </div>
          <ManualProfileForm
            onSubmit={handleManualFormSubmit}
            onSwitchToAI={handleSwitchToAI}
            initialData={manualFormData}
            workerProfileId={workerProfileId}
            existingProfileData={existingProfileData}
          />
        </div>
      </div>
    );
  }

  // Show AI chat interface
  return (
    <>
      <ChatBotLayout 
        ref={chatContainerRef} 
        className={`${pageStyles.container} ${styles.chatContainer}`} 
        role="GIG_WORKER"
        showChatInput={true}
        disableChatInput={isSpecialComponentActive}
        onSendMessage={onSendMessage}
        showOnboardingOptions={true}
        onSwitchToManual={() => {
          setSetupMode('manual');
          setManualFormData(formData);
        }}
        onChangeSetupMethod={handleResetChoice}
      >
        {isReportingIncident && (<IncidentBanner />)}
        
        {error && (
          <div className={`${styles.errorMessage} ${styles.errorMessageContainer}`}>
            {error}
          </div>
        )}

        {chatSteps.map((step, idx) => {
          const key = `step-${step.id}-${step.type}-${idx}`;
          
          if (step.type === "support") {
            return (
              <div key={key} className={styles.supportComponent}>

                <SupportOptions
                  onSwitchToManual={() => { setSetupMode('manual'); setShowSetupChoice(false); }}
                  onContactSupport={() => { window.open('mailto:support@able-ai.com?subject=AI Onboarding Support Needed', '_blank'); }}
                  supportCaseId={supportCaseId}
                />
              </div>
            );
          }
          
          if (step.type === "help") {
            return renderHelpStep(
              key,
              () => {
                // Close help menu - remove the help step
                setChatSteps((prev: any[]) => prev.filter((s: any) => s.id !== step.id));
              },
              () => { 
                setSetupMode('manual'); 
                setShowSetupChoice(false); 
              },
              () => { 
                window.open('mailto:support@able-ai.com?subject=AI Onboarding Support Needed', '_blank'); 
              },
              supportCaseId
            );
          }
          
          if (step.type === "summary") {

            return renderSummaryStep(
              key,
              isSubmitting,
              async () => {

                await handleProfileSubmission(step.summaryData);
                // Mark summary step as complete
                setChatSteps(prev => prev.map(s => s.id === step.id ? { ...s, isComplete: true } : s));

              }
            );
          }
          
          if (step.type === "sanitized") {
            return renderSanitizedConfirmationStep(
              key,
              step.fieldName || '',
              step.originalValue || '',
              step.sanitizedValue || '',
              () => {
                if (step.fieldName && step.sanitizedValue) {
                  handleSanitizedConfirmation(step.fieldName, step.sanitizedValue);
                }
              },
              () => {
                if (step.fieldName) {
                  handleSanitizedReformulate(step.fieldName);
                }
              },
              isSubmitting,
              step.naturalSummary
            );
          }
          
          if (step.type === "typing") {
            // Don't show avatar for typing indicator (id: 2 is the second message typing)
            const showAvatar = false;
            return renderTypingStep(key, showAvatar);
          }
          
          if (step.type === "bot") {
            // Skip rendering bot messages that are followed by input steps
            // The input step will render the bot message itself to avoid duplicates
            const nextStep = chatSteps[idx + 1];
            if (nextStep && nextStep.type === "input") {
              return null;
            }

            // Use MessageBubble like the old file for consistent styling
            return (
              <MessageBubble
                key={key}
                text={typeof step.content === 'string' ? step.content.split('\n').map((line: string, index: number) => (
                  <React.Fragment key={index}>
                    {line}
                    {index < (step.content || '').split('\n').length - 1 && <br />}
                  </React.Fragment>
                )) : step.content}
                senderType="bot"
                isNew={step.isNew}
                role="GIG_WORKER"
              />
            );
          }
          
          if (step.type === "user") {
            return (
              <MessageBubble
                key={key}
                text={typeof step.content === 'object' && step.content !== null ? JSON.stringify(step.content) : String(step.content || '')}
                senderType="user"
                showAvatar={false}
                isNew={step.isNew}
                role="GIG_WORKER"
              />
            );
          }
          
          if (step.type === "input") {
            // Show input step even if completed - don't remove it
            return renderInputStep(
              key,
              step.inputConfig?.placeholder || 'Please provide your input...',
              String(formData[step.inputConfig?.name || ''] || ''),
              (v) => handleInputChange(step.inputConfig?.name || '', v),
              () => { if (step.inputConfig?.name) { handleInputSubmit(step.id, step.inputConfig.name, formData[step.inputConfig.name]); } },
              step.inputConfig?.name === 'about',
              step.inputConfig?.rows,
              step.isComplete
            );
          }

          if (step.type === "confirmation") {
            // Handle different confirmation types
            if (step.confirmationConfig?.type === "existing-skill-title") {
              return renderExistingSkillTitleConfirmationStep(
                key,
                step.confirmationConfig?.message || '',
                step.confirmationConfig?.existingValue || '',
                async () => {
                  if (step.confirmationConfig) {
                    await handleExistingSkillTitleUseAnyway(step.confirmationConfig.fieldName, step.confirmationConfig.existingValue);
                  }
                },
                () => {
                  if (step.confirmationConfig) {
                    handleExistingSkillTitleChange(step.confirmationConfig.fieldName);
                  }
                },
                isSubmitting
              );
            } else {
              // Regular existing data confirmation
              return renderConfirmationStep(
                key,
                step.confirmationConfig?.existingValue || '',
                async () => {
                  if (step.confirmationConfig) {
                    await handleUseExistingData(step.confirmationConfig.fieldName, step.confirmationConfig.existingValue);
                  }
                },
                () => {
                  if (step.confirmationConfig) {
                    handleEditExistingData(step.confirmationConfig.fieldName);
                  }
                },
                isSubmitting,
                step.confirmationConfig?.type,
                step.confirmedChoice
              );
            }
          }

          if (step.type === "shareLink") {
            return renderShareLinkStep(key, step.linkUrl || '', step.linkText);
          }

          if (step.type === "calendar") {
            return renderCalendarStep(
              key,
              typeof formData.availability === 'string' && formData.availability ? new Date(formData.availability) : null,
              (date) => handleInputChange('availability', date ? date.toISOString() : ""),
              () => handlePickerConfirm(step.id, 'availability')
            );
          }

          if (step.type === "availability") {
            const currentAvailability = typeof formData.availability === 'object' ? formData.availability : {
              days: [],
              startTime: '09:00',
              endTime: '17:00',
              frequency: 'weekly',
              ends: 'never',
              startDate: new Date().toISOString().split('T')[0],
              endDate: undefined,
              occurrences: undefined
            };

            return renderAvailabilityStep(
              key,
              currentAvailability,
              (availability: any) => handleInputChange('availability', availability),
              () => handlePickerConfirm(step.id, 'availability'),
              isConfirming
            );
          }

          if (step.type === "location") {
            return renderLocationStep(
              key,
              formData.location,
              (val) => handleInputChange('location', val),
              () => handlePickerConfirm(step.id, 'location')
            );
          }

          if (step.type === "jobTitleConfirmation") {
            return renderJobTitleConfirmationStep(
              key,
              {
                originalValue: step.originalValue!,
                suggestedJobTitle: step.suggestedJobTitle!,
                matchedTerms: step.matchedTerms,
                isAISuggested: step.isAISuggested,
                confirmedChoice: step.confirmedChoice as any,
              },
              {
                onConfirm: () => handleJobTitleConfirm(step.fieldName!, step.suggestedJobTitle!, step.originalValue!),
                onReject: () => handleJobTitleReject(step.fieldName!, step.originalValue!),
              }
            );
          }

          if (step.type === "similarSkillsConfirmation") {
            return renderSimilarSkillsConfirmationStep(
              key,
              {
                originalValue: step.originalValue!,
                similarSkills: step.similarSkills || [],
                confirmedChoice: step.confirmedChoice as any,
              },
              {
                onUseExisting: (skill) => handleSimilarSkillsUseExisting(step.fieldName!, skill),
                onAddNew: () => handleSimilarSkillsAddNew(step.fieldName!, step.originalValue!),
                onGoHome: handleSimilarSkillsGoHome,
              }
            );
          }

          if (step.type === "video") {
            return renderVideoStep(
              key,
              (file) => handleVideoUpload(file, formData?.skills || DEFAULT_SKILL_NAME, step.id),
              <AIVideoScriptDisplay formData={formData} ai={ai} />
            );
          }

          if (step.type === "hashtag-generation") {
            return renderHashtagGenerationStep(
              key,
              { isGenerating: hashtagState.isGenerating, hashtags: hashtagState.hashtags, error: hashtagState.error || undefined },
              'Analyzing your skills and experience to create the perfect hashtags for job matching'
            );
          }
          
          return null;
        })}
        
        <div ref={endOfChatRef} />
      </ChatBotLayout>
    </>
  );
}
