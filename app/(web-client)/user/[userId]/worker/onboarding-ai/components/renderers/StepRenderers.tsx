/**
 * StepRenderers.tsx
 * 
 * Collection of renderer functions for different types of chat steps in the onboarding flow.
 * Each renderer function handles the display of a specific step type, providing consistent
 * UI patterns and proper integration with the chat interface.
 * 
 * Renderer functions include:
 * - Text-based steps (typing, share links, summaries)
 * - Interactive components (calendar, location, video, availability)
 * - Confirmation steps (sanitized content, job titles, similar skills)
 * - Input forms and special components
 */

import React from 'react';
import styles from '../../OnboardingAIPage.module.css';

// Import UI components
import { BotAvatar } from '../BotAvatar';
import TypingIndicator from '../TypingIndicator';
import ShareLinkBubble from '@/app/components/onboarding/ShareLinkBubble';
import CalendarPickerBubble from '@/app/components/onboarding/CalendarPickerBubble';
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';
import VideoRecorderOnboarding from '@/app/components/onboarding/VideoRecorderOnboarding';
import SanitizedConfirmationBubble from '@/app/components/onboarding/SanitizedConfirmationBubble';
import OnboardingAvailabilityStep from '../OnboardingAvailabilityStep';
import { AvailabilityFormData } from '@/app/types/AvailabilityTypes';
import Image from 'next/image';
import SanitizedMessage from '../SanitizedMessage';
import HelpMenu from '../HelpMenu';

/**
 * Renders a typing indicator step
 * Shows the AI avatar with a typing animation to indicate AI is processing
 */
export function renderTypingStep(key: string | number, showAvatar: boolean = true) {
  return (
    <div key={key} className={styles.typingIndicatorContainer} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
      {showAvatar && <BotAvatar />}
      <TypingIndicator />
    </div>
  );
}

/**
 * Renders a help menu step
 * Shows the help menu with options and commands
 */
export function renderHelpStep(
  key: string | number, 
  onClose: () => void,
  onSwitchToManual: () => void,
  onContactSupport: () => void,
  supportCaseId?: string | null
) {
  return (
    <div key={key} style={{ marginBottom: '0.5rem' }}>
      <HelpMenu 
        onClose={onClose}
        onSwitchToManual={onSwitchToManual}
        onContactSupport={onContactSupport}
        supportCaseId={supportCaseId}
      />
    </div>
  );
}

/**
 * Renders a share link step
 * Displays a shareable link with optional custom text
 */
export function renderShareLinkStep(key: string | number, linkUrl: string, linkText?: string) {
  return (
    <div key={key} className={styles.shareLinkComponent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <ShareLinkBubble linkUrl={linkUrl} linkText={linkText} />
    </div>
  );
}

/**
 * Renders a calendar picker step
 * Displays the AI avatar with a calendar picker for date selection
 */
export function renderCalendarStep(
  key: string | number,
  value: Date | null,
  onChange: (d: Date | null) => void,
  onConfirm?: () => void
) {
  return (
    <div key={key} className={styles.calendarComponent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <BotAvatar />
        <div className="bubble bubbleBot" style={{ maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: '18px', backgroundColor: '#333', color: '#fff' }}>
          Please pick a start date for your availability.
        </div>
      </div>
      <CalendarPickerBubble value={value} onChange={(d) => onChange(d)} />
      {onConfirm && (
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onConfirm} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontWeight: 600 }}>Confirm</button>
        </div>
      )}
    </div>
  );
}

/**
 * Renders a location picker step
 * Displays the AI avatar with a location picker for address selection
 */
export function renderLocationStep(
  key: string | number,
  value: any,
  onChange: (v: any) => void,
  onConfirm?: () => void
) {
  // Wrapper to match LocationPickerBubble's onConfirm signature
  const handleLocationConfirm = (address: string, coord: { lat: number; lng: number }) => {
    if (onConfirm) {
      onConfirm();
    }
  };
  
  return (
    <div key={key} className={styles.locationComponent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <BotAvatar />
        <div className="bubble bubbleBot" style={{ maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: '18px', backgroundColor: '#333', color: '#fff' }}>
          Please share your location.
        </div>
      </div>
      <LocationPickerBubble value={value} onChange={onChange} showConfirm={true} onConfirm={handleLocationConfirm} role="GIG_WORKER" />
    </div>
  );
}

export function renderVideoStep(
  key: string | number,
  onRecorded: (file: Blob) => void,
  childrenAbove?: React.ReactNode
) {
  return (
    <div key={key} className={styles.videoComponent} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {childrenAbove}
      <VideoRecorderOnboarding onVideoRecorded={onRecorded} />
    </div>
  );
}


export function renderInputStep(
  key: string | number,
  placeholder: string,
  value: string,
  onChange: (v: string) => void,
  onSubmit: () => void,
  isAboutField?: boolean,
  rows?: number,
  isComplete?: boolean
) {
  if (isAboutField) {
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ 
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}>
                <Image 
                  src="/images/ableai.png" 
                  alt="Able AI" 
                  width={24} 
                  height={24} 
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div style={{ 
          background: '#1a1a1a', 
          borderRadius: 12, 
          padding: 16, 
          margin: '16px 0', 
          boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3), 0 0 0 1px rgba(37, 99, 235, 0.1)', 
          border: '2px solid #2563eb',
          opacity: 1,
          transform: 'scale(1)',
          transformOrigin: 'center',
          position: 'relative'
        }}>
          <div style={{ 
            marginBottom: 16, 
            color: '#ffffff', 
            fontSize: '15px', 
            lineHeight: 1.4,
            fontWeight: 600
          }}>
            {placeholder || 'Please provide your input...'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <textarea
              style={{ 
                width: '100%',
                background: isComplete ? '#1a1a1a' : '#2a2a2a', 
                color: isComplete ? '#888' : '#fff', 
                border: isComplete ? '1px solid #333' : '1px solid #444', 
                borderRadius: 8, 
                padding: '12px', 
                fontSize: '14px', 
                resize: 'vertical',
                minHeight: '80px',
                cursor: isComplete ? 'not-allowed' : 'text'
              }}
              placeholder={placeholder || 'Type your message...'}
              rows={rows || 3}
              value={value}
              onChange={(e) => !isComplete && onChange(e.target.value)}
              onKeyDown={(e) => {
                if (!isComplete && e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit();
                }
              }}
              disabled={isComplete}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              style={{ 
                background: isComplete ? '#555' : '#2563eb', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '8px 16px', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: isComplete ? 'not-allowed' : 'pointer', 
                transition: 'background-color 0.2s',
                opacity: isComplete ? 0.6 : 1
              }}
              onClick={!isComplete ? onSubmit : undefined}
              disabled={isComplete}
            >
              {isComplete ? 'Completed' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render only the bot message with the prompt
  // The user will respond using the chat input at the bottom, not a separate input field
  return (
    <div key={key} className="messageWrapper alignBot" data-role="GIG_WORKER" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}>
      <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Image 
              src="/images/ableai.png" 
              alt="Able AI" 
              width={24} 
              height={24} 
              style={{
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>
      </div>

      <div className="bubble bubbleBot" style={{ 
        maxWidth: '70%', 
        padding: '0.75rem 1rem', 
        borderRadius: '18px', 
        fontSize: '14px', 
        lineHeight: '1.4', 
        wordWrap: 'break-word',
        backgroundColor: '#333',
        color: '#fff',
        borderBottomLeftRadius: '4px'
      }}>
        {placeholder || 'Please provide your input...'}
      </div>
    </div>
  );
}

export function renderSummaryStep(
  key: string | number,
  isSubmitting: boolean,
  onConfirmClick: () => Promise<void>
) {
  return (
    <div key={key} className={styles.summaryComponent}>
      <div className={`${styles.componentLabel}`} style={{ color: 'white' }}>
        
      </div>
      <div
        className="messageWrapper alignBot"
        data-role="GIG_WORKER"
        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '1rem' }}
      >
        <div className="bubble bubbleBot" style={{ 
          maxWidth: '70%', 
          padding: '0.75rem 1rem', 
          borderRadius: '18px', 
          fontSize: '14px', 
          lineHeight: '1.4', 
          wordWrap: 'break-word',
          backgroundColor: '#333',
          color: '#fff',
          borderBottomLeftRadius: '4px'
        }}>
          <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '16px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '16px', 
                lineHeight: '1.6',
                color: '#e5e5e5'
              }}>
                All profile information collected! Ready to go to your dashboard?
              </p>
            </div>
            <button
              style={{ 
                marginTop: 16, 
                background: isSubmitting ? "#666" : "var(--primary-color)", 
                color: "#fff", 
                border: "none", 
                borderRadius: 8, 
                padding: "8px 16px", 
                fontWeight: 600,
                transition: 'all 0.3s ease',
                transform: 'scale(1)',
                animation: isSubmitting ? 'none' : 'pulse 2s infinite',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              disabled={isSubmitting}
              onClick={onConfirmClick}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-darker-color)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary-color)';
              }}
            >
              {isSubmitting ? 'Saving Profile...' : 'Confirm & Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>
    </div>
  );
}

export function renderJobTitleConfirmationStep(
  key: string | number,
  data: {
    originalValue: string;
    suggestedJobTitle: string;
    matchedTerms?: string[];
    isAISuggested?: boolean;
    confirmedChoice?: 'title' | 'original';
  },
  handlers: {
    onConfirm: () => void;
    onReject: () => void;
  }
) {
  return (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Image src="/images/ableai.png" alt="Able AI" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '16px', marginBottom: '12px' }}>
          🎯 Suggested Standardized Job Title
          {data.isAISuggested && (
            <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 500, marginLeft: '8px' }}>
              🤖 AI Suggested
            </span>
          )}
        </div>
        <div style={{ color: '#e5e5e5', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>
          Based on your skills "{data.originalValue}", I suggest this as your job title:
        </div>
        <div style={{ background: '#2a2a2a', padding: '16px', borderRadius: '8px', border: '1px solid #444', marginBottom: '16px' }}>
          <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '18px', marginBottom: '8px' }}>
            {data.suggestedJobTitle}
          </div>
          {data.matchedTerms && (
            <div style={{ color: '#888', fontSize: '13px' }}>
              Matched: {data.matchedTerms.join(', ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={handlers.onConfirm} style={{ background: data.confirmedChoice === 'title' ? '#555' : 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: data.confirmedChoice ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: data.confirmedChoice ? 0.7 : 1, transition: 'all 0.2s ease' }} disabled={!!data.confirmedChoice}>
            {data.confirmedChoice === 'title' ? 'Title Confirmed' : 'Use This Title'}
          </button>
          <button onClick={handlers.onReject} style={{ background: data.confirmedChoice === 'original' ? '#555' : '#444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: data.confirmedChoice ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: data.confirmedChoice ? 0.7 : 1, transition: 'all 0.2s ease' }} disabled={!!data.confirmedChoice}>
            {data.confirmedChoice === 'original' ? 'Original Kept' : 'Keep Original'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function renderSimilarSkillsConfirmationStep(
  key: string | number,
  data: { originalValue: string; similarSkills: Array<{ id: string; name: string; experienceYears?: number; agreedRate?: number }>; confirmedChoice?: 'new' },
  handlers: { onUseExisting: (skill: any) => void; onAddNew: () => void; onGoHome: () => void }
) {
  return (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
              <Image src="/images/ableai.png" alt="Able AI" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '16px', marginBottom: '12px' }}>
          🔍 Similar Skills Found
        </div>
        <div style={{ color: '#e5e5e5', fontSize: '15px', lineHeight: '1.6', marginBottom: '16px' }}>
          I found similar skills in your profile for "{data.originalValue}". You can either keep it and go back to home or add a new skill.
        </div>

        <div style={{ marginBottom: '20px' }}>
          {data.similarSkills.map((skill) => (
            <div key={skill.id} style={{ background: '#2a2a2a', padding: '12px', borderRadius: '8px', border: '1px solid #444', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => handlers.onUseExisting(skill)}>
              <div style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '16px', marginBottom: '4px' }}>{skill.name}</div>
              <div style={{ color: '#888', fontSize: '13px' }}>{skill.experienceYears ? `${skill.experienceYears} years experience` : 'No experience specified'} • £{skill.agreedRate}/hour</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button onClick={() => {
            if (handlers.onGoHome) {
              handlers.onGoHome();
            }
          }} style={{ background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s ease' }}>
            ← Go Home
          </button>
          <button onClick={handlers.onAddNew} style={{ background: data.confirmedChoice === 'new' ? '#555' : 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: 600, cursor: data.confirmedChoice ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: data.confirmedChoice ? 0.7 : 1, transition: 'all 0.2s ease' }} disabled={!!data.confirmedChoice}>
            {data.confirmedChoice === 'new' ? 'Adding New Skill' : 'Add a New Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function renderHashtagGenerationStep(
  key: string | number,
  state: { isGenerating: boolean; hashtags: string[]; error?: string },
  hint?: string
) {
  return null;
}

export function renderSanitizedStep(
  key: string | number,
  naturalSummary: string,
  isCompleted: boolean,
  confirmClicked: boolean,
  isReformulatingThisField: boolean,
  fieldName: string,
  sanitizedValue: any,
  onConfirm: (field: string, value: any) => void,
  onReformulate: (field: string) => void
) {
  return (
    <div key={key} className={styles.validationComponent}>
      <div className={`${styles.componentLabel}`} style={{ background: '#3b82f6', color: 'white' }}>
        ✔️ Validation Confirmation
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <BotAvatar />
        <div className="bubble bubbleBot" style={{ 
          maxWidth: '70%', 
          padding: '0.75rem 1rem', 
          borderRadius: '18px', 
          fontSize: '14px', 
          lineHeight: '1.4', 
          wordWrap: 'break-word', 
          backgroundColor: '#333', 
          color: '#fff', 
          borderBottomLeftRadius: '4px' 
        }}>
          <SanitizedMessage
            naturalSummary={naturalSummary}
            isCompleted={isCompleted}
            confirmClicked={confirmClicked}
            isReformulatingThisField={isReformulatingThisField}
            fieldName={fieldName}
            sanitizedValue={sanitizedValue}
            onConfirm={onConfirm}
            onReformulate={onReformulate}
          />
        </div>
      </div>
    </div>
  );
}

export function renderExistingSkillTitleConfirmationStep(
  key: string | number,
  message: string,
  existingValue: string,
  onUseAnyway: () => void,
  onChange: () => void,
  isSubmitting?: boolean
) {
  return (
    <div key={key} style={{ 
      background: 'rgb(254, 226, 226)', 
      border: '2px solid rgb(239, 68, 68)', 
      borderRadius: 12, 
      padding: 16, 
      margin: '16px 0px',
      boxShadow: 'rgba(239, 68, 68, 0.3) 0px 4px 20px, rgba(239, 68, 68, 0.1) 0px 0px 0px 1px'
    }}>
      <div style={{ 
        marginBottom: 16, 
        color: 'rgb(127, 29, 29)', 
        fontSize: 15, 
        lineHeight: 1.4, 
        fontWeight: 600,
        whiteSpace: 'pre-line'
      }}>
        {message}
      </div>
      <div style={{ 
        marginBottom: 16, 
        color: 'rgb(127, 29, 29)', 
        fontSize: 14, 
        lineHeight: 1.4,
        fontStyle: 'italic'
      }}>
        Your input: "{existingValue}"
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button 
          style={{ 
            background: 'rgb(239, 68, 68)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: '14px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
            transition: 'background-color 0.2s',
            opacity: isSubmitting ? 0.6 : 1
          }} 
          onClick={onUseAnyway} 
          disabled={!!isSubmitting}
        >
          Use Anyway
        </button>
        <button 
          style={{ 
            background: 'rgb(59, 130, 246)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: '14px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer', 
            transition: 'background-color 0.2s',
            opacity: isSubmitting ? 0.6 : 1
          }} 
          onClick={onChange} 
          disabled={!!isSubmitting}
        >
          Change Skill Title
        </button>
      </div>
    </div>
  );
}

export function renderSanitizedConfirmationStep(
  key: string | number,
  fieldName: string,
  originalValue: string,
  sanitizedValue: string,
  onConfirm: () => void,
  onReformulate: () => void,
  isSubmitting?: boolean,
  naturalSummary?: string
) {
  return (
    <div key={key}>
      <SanitizedConfirmationBubble
        fieldName={fieldName}
        sanitizedValue={sanitizedValue}
        originalValue={originalValue}
        onConfirm={onConfirm}
        onReformulate={onReformulate}
        isProcessing={isSubmitting}
        role="GIG_WORKER"
        naturalSummary={naturalSummary}
      />
    </div>
  );
}

export function renderConfirmationStep(
  key: string | number,
  existingValue: string,
  onUse: () => Promise<void> | void,
  onEdit: () => void,
  isSubmitting?: boolean,
  fieldType?: string,
  confirmedChoice?: 'use' | 'edit'
) {
  // Create header message based on field type
  const getHeaderMessage = (fieldType?: string) => {
    switch (fieldType) {
      case 'bio':
        return "I see you already have a bio! Would you like to use your current bio or create a new one?";
      case 'location':
        return "I see you already have a location set! Would you like to use your current location or update it?";
      case 'availability':
        return "I see you already have availability set! Would you like to use your current schedule or update it?";
      case 'skills':
        return "I see you already have this skill! Would you like to use your existing skill or add it as a new one?";
      default:
        return "I see you already have this information! Would you like to use your current data or update it?";
    }
  };

  return (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
      {/* Header message with AI avatar */}
      <div className="messageWrapper alignBot" data-role="GIG_WORKER" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <BotAvatar />
        <div className="bubble bubbleBot" style={{ maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: '18px', fontSize: '14px', lineHeight: '1.4', wordWrap: 'break-word', backgroundColor: '#333', color: '#fff', borderBottomLeftRadius: '4px' }}>
          {getHeaderMessage(fieldType)}
        </div>
      </div>

      {/* Existing value display with AI avatar */}
      <div className="messageWrapper alignBot" data-role="GIG_WORKER" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
        <BotAvatar />
        <div className="bubble bubbleBot" style={{ maxWidth: '70%', padding: '0.75rem 1rem', borderRadius: '18px', fontSize: '14px', lineHeight: '1.4', wordWrap: 'break-word', backgroundColor: '#333', color: '#fff', borderBottomLeftRadius: '4px' }}>
          <div style={{ marginBottom: 16, fontStyle: 'italic', fontSize: '15px', lineHeight: 1.4, fontWeight: 600 }}>
            {fieldType === 'availability' ? (
              <div style={{ color: '#10b981', fontWeight: 600 }}>
                Current Schedule: {(() => {
                  try {
                    const availability = typeof existingValue === 'string' ? JSON.parse(existingValue) : existingValue;
                    const days = availability.days || [];
                    const startTime = availability.startTime || '09:00';
                    const endTime = availability.endTime || '17:00';
                    const dayNames = days.map((day: string) => {
                      const dayMap: { [key: string]: string } = {
                        'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday', 'Thu': 'Thursday',
                        'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday',
                        'monday': 'Monday', 'tuesday': 'Tuesday', 'wednesday': 'Wednesday', 'thursday': 'Thursday',
                        'friday': 'Friday', 'saturday': 'Saturday', 'sunday': 'Sunday'
                      };
                      return dayMap[day] || day;
                    });
                    return `${dayNames.join(', ')} from ${startTime} to ${endTime}`;
                  } catch (error) {
                    return 'Schedule configured';
                  }
                })()}
              </div>
            ) : (
              existingValue
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              style={{ 
                background: confirmedChoice === 'use' ? '#555' : '#2563eb', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 8, 
                padding: '8px 16px', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: (isSubmitting || confirmedChoice) ? 'not-allowed' : 'pointer', 
                transition: 'background-color 0.2s', 
                display: 'block', 
                visibility: 'visible', 
                opacity: confirmedChoice === 'use' ? 0.7 : 1 
              }} 
              onClick={onUse} 
              disabled={!!isSubmitting || !!confirmedChoice}
            >
              {confirmedChoice === 'use' ? 'Okay' : 
               fieldType === 'bio' ? 'Use this bio' : 
               fieldType === 'location' ? 'Use this location' :
               fieldType === 'availability' ? 'Use this availability' :
               fieldType === 'skills' ? 'Use this skill' : 'Use this'}
            </button>
            <button 
              style={{ 
                background: confirmedChoice === 'edit' ? '#555' : 'transparent', 
                color: confirmedChoice === 'edit' ? '#fff' : '#2563eb', 
                border: confirmedChoice === 'edit' ? 'none' : '1px solid #2563eb', 
                borderRadius: 8, 
                padding: '8px 16px', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: (isSubmitting || confirmedChoice) ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s',
                opacity: confirmedChoice === 'edit' ? 0.7 : 1
              }} 
              onClick={onEdit}
              disabled={!!isSubmitting || !!confirmedChoice}
            >
              {confirmedChoice === 'edit' ? 'Editing...' : 'Edit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


export function renderAvailabilityStep(
  key: string | number,
  currentAvailability: AvailabilityFormData,
  onAvailabilityChange: (availability: AvailabilityFormData) => void,
  onConfirm: () => void,
  isSubmitting?: boolean
) {
  return (
    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* AI Avatar */}
      <div style={{ 
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        marginBottom: '0.5rem'
      }}>
        <div style={{ flexShrink: 0, marginTop: '0.25rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-darker-color))',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#000000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <Image 
                src="/images/ableai.png" 
                alt="Able AI" 
                width={24} 
                height={24} 
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <OnboardingAvailabilityStep
        currentAvailability={currentAvailability}
        onAvailabilityChange={onAvailabilityChange}
        onConfirm={onConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}


