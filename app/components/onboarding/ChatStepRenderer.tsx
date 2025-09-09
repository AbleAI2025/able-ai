import React from 'react';
import MessageBubble from './MessageBubble';
import ReferenceMessageBubble from './ReferenceMessageBubble';
import InputBubble from './InputBubble';
import LocationPickerBubble from './LocationPickerBubble';
import CalendarPickerBubble from './CalendarPickerBubble';
import { ChatStep } from '@/app/hooks';
import { StepInputConfig } from '@/app/types';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';



interface ChatStepRendererProps {
  step: ChatStep;
  idx: number;
  formData: Record<string, any>;
  isTyping: boolean;
  confirmDisabled: Record<string, boolean>;
  expandedSummaryFields: Record<string, boolean>;
  isActiveInputStep: (step: ChatStep, idx: number) => boolean;
  handleInputChange: (name: string, value: any) => void;
  handleInputSubmit: (stepId: number, inputName: string) => void;
  handleSanitizedConfirm: (fieldName: string, sanitized: string) => void;
  handleSanitizedReformulate: (fieldName: string) => void;
  setConfirmDisabled: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  setExpandedSummaryFields: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  isSubmitting?: boolean;
  role?: 'BUYER' | 'GIG_WORKER';
}

// Typing indicator component
const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', color: '#0f766e', fontWeight: 600 }}>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite' }}>.</span>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite 0.2s' }}>.</span>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite 0.4s' }}>.</span>
    <style>{`
      @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
    `}</style>
  </div>
);

export default function ChatStepRenderer({
  step,
  idx,
  formData,
  isTyping,
  confirmDisabled,
  expandedSummaryFields,
  isActiveInputStep,
  handleInputChange,
  handleInputSubmit,
  handleSanitizedConfirm,
  handleSanitizedReformulate,
  setConfirmDisabled,
  setExpandedSummaryFields,
  isSubmitting = false,
  role = 'GIG_WORKER',
}: ChatStepRendererProps) {

  
  const key = `step-${step.id}-${step.type}-${step.inputConfig?.name || Math.random()}`;

  // Handle summary rendering
  if (step.type === "bot" && typeof step.content === "string" && step.content.startsWith("Thank you! Here is a summary of your gig:")) {
    const match = step.content.match(/Thank you! Here is a summary of your gig:\n([\s\S]*)/);
    let summaryData = null;
    if (match) {
      try {
        summaryData = JSON.parse(match[1]);
      } catch (e) {
        summaryData = null;
      }
    }
    if (summaryData) {
      return (
        <div key={key} style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
          <h3 style={{ marginTop: 0 }}>Gig Summary</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {Object.entries(summaryData).map(([field, value]) => {
              if (field === 'gigLocation' && value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
                const loc = value as any;
                return (
                  <li key={field} style={{ marginBottom: 8 }}>
                    <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                    <span>
                      {loc.formatted_address || `Coordinates: ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}`}
                    </span>
                  </li>
                );
              }
              if (field === 'gigLocation' && typeof value === 'string' && value.length > 40) {
                return (
                  <li key={field} style={{ marginBottom: 8 }}>
                    <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                    <span
                      style={{
                        cursor: 'pointer',
                        wordBreak: 'break-all',
                        display: 'inline-block',
                        maxWidth: expandedSummaryFields[field] ? '100%' : 220,
                        whiteSpace: expandedSummaryFields[field] ? 'normal' : 'nowrap',
                        overflow: 'hidden',
                        textOverflow: expandedSummaryFields[field] ? 'clip' : 'ellipsis',
                        verticalAlign: 'bottom',
                      }}
                      title={expandedSummaryFields[field] ? 'Click to collapse' : 'Click to expand'}
                      onClick={() =>
                        setExpandedSummaryFields(prev => ({
                          ...prev,
                          [field]: !prev[field]
                        }))
                      }
                    >
                      {expandedSummaryFields[field] ? value : value.slice(0, 37) + '...'}
                    </span>
                  </li>
                );
              }
              return (
                <li key={field} style={{ marginBottom: 8 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                  <span>
                    {field === 'hourlyRate' && typeof value === 'number'
                      ? `£${value.toFixed(2)}`
                      : value && typeof value === 'object' && 'lat' in value && 'lng' in value
                        ? (value as any).formatted_address || `Coordinates: ${(value as any).lat.toFixed(6)}, ${(value as any).lng.toFixed(6)}`
                        : typeof value === 'object'
                          ? JSON.stringify(value)
                          : String(value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }
  }

  // Bot message
  if (step.type === "bot") {
    const content = step.content as string;

    
    // TEST: Log the exact string we're checking
    if (content && content.includes("You need one reference per skill")) {

    } else {

    }
    
    // Check if this is a reference message - FORCE TEST
    if (content && content.includes("You need one reference per skill")) {

      
      // Force use ReferenceMessageBubble for testing
      try {
        const result = <ReferenceMessageBubble key={key} content={content} />;

        return result;
      } catch (error) {
        
        // Fallback to regular message bubble

        return (
          <MessageBubble
            key={key}
            text={content}
            senderType="bot"
            showAvatar={false}
            role="GIG_WORKER"
          />
        );
      }
    }
    
    // Regular bot message with avatar

    return (
      <MessageBubble
        key={key}
        text={content}
        senderType="bot"
        showAvatar={true}
        role="GIG_WORKER"
      />
    );
  }



  // User message
  if (step.type === "user") {
    return (
      <MessageBubble
        key={key}
        text={typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content)}
        senderType="user"
        showAvatar={false}
        role="GIG_WORKER"
      />
    );
  }

  // Input step
  if (step.type === "input" && !step.isComplete) {
    const inputConf = step.inputConfig!;
    const isActive = isActiveInputStep(step, idx);

    // Location picker for gigLocation
    if (inputConf.name === "gigLocation") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LocationPickerBubble
            value={formData.gigLocation}
            onChange={val => handleInputChange('gigLocation', val)}
            showConfirm={!!formData.gigLocation && isActive}
            onConfirm={() => handleInputSubmit(step.id, 'gigLocation')}
            role={role}
          />
        </div>
      );
    }

    // Calendar picker for gigDate
    if (inputConf.name === "gigDate") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CalendarPickerBubble
            value={formData.gigDate ? new Date(formData.gigDate) : null}
            onChange={date => handleInputChange('gigDate', date ? date.toISOString() : "")}
          />
          {isActive && formData.gigDate && (
            <button
              style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
              onClick={() => handleInputSubmit(step.id, 'gigDate')}
            >
              Confirm
            </button>
          )}
        </div>
      );
    }

    // Custom hourly rate input with British Pounds symbol
    if (inputConf.name === "hourlyRate") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>{inputConf.label}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>£</span>
            <input
              id={inputConf.name}
              name={inputConf.name}
              type="number"
              min={VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}
              step="0.01"
              value={formData[inputConf.name] || ""}
              disabled={isSubmitting}
              placeholder="Hourly Rate in £ (British Pounds)"
              onChange={e => handleInputChange(inputConf.name, e.target.value)}
              style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
              onKeyPress={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleInputSubmit(step.id, inputConf.name);
                }
              }}
            />
          </div>

          {isActive && formData[inputConf.name] && (
            <button
              style={{ margin: '8px 0', background: '#0f766e', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
              onClick={() => {
                setConfirmDisabled(prev => ({ ...prev, [inputConf.name]: true }));
                handleInputSubmit(step.id, inputConf.name);
              }}
              disabled={!!confirmDisabled[inputConf.name]}
            >
              Confirm
            </button>
          )}
        </div>
      );
    }

    // Standard input bubble
    const allowedTypes = ["number", "text", "email", "password", "date", "tel", "time"];
    const safeType = allowedTypes.includes(inputConf.type) ? inputConf.type : "text";
    
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InputBubble
          id={inputConf.name}
          name={inputConf.name}
          value={formData[inputConf.name] || ""}
          disabled={isSubmitting}
          type={safeType as "number" | "text" | "email" | "password" | "date" | "tel" | "time"}
          placeholder={inputConf.placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange(inputConf.name, e.target.value)
          }
          onFocus={() => {}}
          onBlur={() => {}}
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleInputSubmit(step.id, inputConf.name);
            }
          }}
        />
        {isActive && formData[inputConf.name] && (
          <button
            style={{ margin: '8px 0', background: '#0f766e', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
            onClick={() => {
              setConfirmDisabled(prev => ({ ...prev, [inputConf.name]: true }));
              handleInputSubmit(step.id, inputConf.name);
            }}
            disabled={!!confirmDisabled[inputConf.name]}
          >
            Confirm
          </button>
        )}
      </div>
    );
  }

  // Typing animation
  if (isTyping && idx === 0) {
    return <MessageBubble key={key + '-typing'} text={<TypingIndicator />} senderType="bot" role="GIG_WORKER" />;
  }

  // Sanitized step
  if (step.type === "sanitized" && step.fieldName) {
    const isStepComplete = step.isComplete;
    const isLocationCoords = step.fieldName === 'gigLocation' && typeof step.originalValue === 'object' && 'lat' in step.originalValue;

    if (isLocationCoords) {
      return (
        <MessageBubble
          key={key}
          text={
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0' }}>
              <div style={{ marginBottom: 8 }}>{step.sanitizedValue}</div>
              {!isStepComplete && (
                <button
                  style={{ background: '#0f766e', border: 'none', borderRadius: 8, padding: '6px 16px' }}
                  onClick={() => handleSanitizedConfirm(step.fieldName!, step.originalValue!)}
                >
                  Confirm Location
                </button>
              )}
            </div>
          }
          senderType="bot"
          role="GIG_WORKER"
        />
      );
    }

    return (
      <MessageBubble
        key={key}
        text={
          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ marginBottom: 12, fontStyle: 'italic', color: '#0f766e', fontWeight: 600 }}>{step.sanitizedValue}</div>
            {!isStepComplete && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={{ background: '#0f766e', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                  onClick={() => handleSanitizedConfirm(step.fieldName!, step.sanitizedValue!)}
                  disabled={isStepComplete}
                >
                  Confirm
                </button>
                <button
                  style={{ background: '#fff', color: '#0f766e', border: '1px solid #0f766e', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                  onClick={() => handleSanitizedReformulate(step.fieldName!)}
                  disabled={isStepComplete}
                >
                  {step.fieldName === 'videoIntro' ? 'Re-shoot' : 'Edit'}
                </button>
              </div>
            )}
          </div>
        }
        senderType="bot"
        role="GIG_WORKER"
      />
    );
  }

  return null;
} 