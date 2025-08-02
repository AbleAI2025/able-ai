import React from 'react';
import MessageBubble from './MessageBubble';
import InputBubble from './InputBubble';
import LocationPickerBubble from './LocationPickerBubble';
import CalendarPickerBubble from './CalendarPickerBubble';
import { ChatStep } from '@/app/hooks';
import { StepInputConfig } from '@/app/types';

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
                      Lat: {loc.lat}, Lng: {loc.lng}
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
                    {value && typeof value === 'object' && 'lat' in value && 'lng' in value
                      ? `Lat: ${(value as any).lat}, Lng: ${(value as any).lng}`
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
    return (
      <MessageBubble
        key={key}
        text={step.content as string}
        senderType="bot"
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
            label={inputConf.label}
            value={formData.gigLocation}
            onChange={val => handleInputChange('gigLocation', val)}
            showConfirm={!!formData.gigLocation && isActive}
            onConfirm={() => handleInputSubmit(step.id, 'gigLocation')}
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

    // Custom hourly rate input with euro symbol
    if (inputConf.name === "hourlyRate") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontWeight: 600 }}>{inputConf.label}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontWeight: 600, fontSize: 18 }}>€</span>
            <input
              id={inputConf.name}
              name={inputConf.name}
              type="number"
              min="0"
              step="0.01"
              value={formData[inputConf.name] || ""}
              disabled={isSubmitting}
              placeholder="Hourly Rate in €"
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
              style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
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
    const allowedTypes = ["number", "text", "email", "password", "date", "tel"];
    const safeType = allowedTypes.includes(inputConf.type) ? inputConf.type : "text";
    
    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <InputBubble
          id={inputConf.name}
          name={inputConf.name}
          label={inputConf.label}
          value={formData[inputConf.name] || ""}
          disabled={isSubmitting}
          type={safeType as "number" | "text" | "email" | "password" | "date" | "tel"}
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
          ref={undefined}
        />
        {isActive && formData[inputConf.name] && (
          <button
            style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
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
    return <MessageBubble key={key + '-typing'} text={<TypingIndicator />} senderType="bot" />;
  }

  // Sanitized step
  if (step.type === "sanitized" && step.fieldName) {
    const isStepComplete = step.isComplete;
    const isLocationCoords = step.fieldName === 'gigLocation' && typeof step.originalValue === 'object' && 'lat' in step.originalValue;

    if (isLocationCoords) {
      return (
        <div key={key} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0' }}>
          <div style={{ marginBottom: 8 }}>{step.sanitizedValue}</div>
          {!isStepComplete && (
            <button
              style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px' }}
              onClick={() => handleSanitizedConfirm(step.fieldName!, step.originalValue!)}
            >
              Confirm Location
            </button>
          )}
        </div>
      );
    }

    return (
      <div key={key} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0001' }}>
        <div style={{ marginBottom: 8, color: '#0f766e', fontWeight: 600 }}>This is what you wanted?</div>
        <div style={{ marginBottom: 12, fontStyle: 'italic' }}>{step.sanitizedValue}</div>
        {!isStepComplete && (
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
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
              Reformulate
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
} 