import React from 'react';
import { ChatStep } from '../types/chat';
import MessageBubble from '@/app/components/onboarding/MessageBubble';
import InputBubble from '@/app/components/onboarding/InputBubble';
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';
import CalendarPickerBubble from '@/app/components/onboarding/CalendarPickerBubble';
import { LoadingIndicator } from '../components/LoadingIndicator';

interface ChatStepRendererProps {
  step: ChatStep;
  idx: number;
  isTyping: boolean;
  formData: Record<string, any>;
  isSubmitting: boolean;
  validationState: Record<string, any>;
  currentFocusedInputName: string | null;
  isActiveStep: (step: ChatStep, idx: number) => boolean;
  onInputChange: (name: string, value: any) => void;
  onInputSubmit: (stepId: number, inputName: string) => void;
  onFocus: (name: string) => void;
  onBlur: (name: string, value: any) => void;
  expandedSummaryFields: Record<string, boolean>;
  onToggleExpand: (field: string) => void;
  onSanitizedConfirm: (fieldName: string, sanitized: string) => void;
  onSanitizedReformulate: (fieldName: string) => void;
}

export function ChatStepRenderer({
  step,
  idx,
  isTyping,
  formData,
  isSubmitting,
  validationState,
  currentFocusedInputName,
  isActiveStep,
  onInputChange,
  onInputSubmit,
  onFocus,
  onBlur,
  expandedSummaryFields,
  onToggleExpand,
  onSanitizedConfirm,
  onSanitizedReformulate,
}: ChatStepRendererProps) {
  const key = `step-${step.id}-${step.type}-${step.inputConfig?.name || Math.random()}`;

  if (step.type === "bot") {
    return (
      <MessageBubble
        key={key}
        text={step.content as string}
        senderType="bot"
        role="BUYER"
      />
    );
  }

  if (step.type === "user") {
    return (
      <MessageBubble
        key={key}
        text={typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content)}
        senderType="user"
        showAvatar={false}
        role="BUYER"
      />
    );
  }

  if (step.type === "input" && !step.isComplete) {
    const inputConf = step.inputConfig!;
    const isActive = isActiveStep(step, idx);

    if (inputConf.name === "gigLocation") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <LocationPickerBubble
            value={formData.gigLocation}
            onChange={val => onInputChange('gigLocation', val)}
            showConfirm={!!formData.gigLocation && isActive}
            onConfirm={() => onInputSubmit(step.id, 'gigLocation')}
          />
        </div>
      );
    }

    if (inputConf.name === "gigDate") {
      return (
        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <CalendarPickerBubble
            value={formData.gigDate ? new Date(formData.gigDate) : null}
            onChange={date => onInputChange('gigDate', date ? date.toISOString() : "")}
          />
          {isActive && formData.gigDate && (
            <button
              style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
              onClick={() => onInputSubmit(step.id, 'gigDate')}
            >
              Confirm
            </button>
          )}
        </div>
      );
    }

    const allowedTypes = ["number", "text", "email", "password", "date", "tel"];
    const safeType = allowedTypes.includes(inputConf.type) ? inputConf.type : "text";

    return (
      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div>
          <InputBubble
            id={inputConf.name}
            name={inputConf.name}
            value={formData[inputConf.name] || ""}
            disabled={isSubmitting}
            type={safeType as "number" | "text" | "email" | "password" | "date" | "tel"}
            placeholder={inputConf.placeholder}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onInputChange(inputConf.name, e.target.value)
            }
            onFocus={() => onFocus(inputConf.name)}
            onBlur={() => onBlur(inputConf.name, formData[inputConf.name])}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter" && (!validationState[inputConf.name] || validationState[inputConf.name].isValid)) {
                e.preventDefault();
                onInputSubmit(step.id, inputConf.name);
              }
            }}
            ref={(el: HTMLInputElement | null) => {
              if (el && currentFocusedInputName === inputConf.name) el.focus();
            }}
          />
          {validationState[inputConf.name]?.errors.map((error: string, i: number) => (
            <div key={i} style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {error}
            </div>
          ))}
        </div>
        {isActive && formData[inputConf.name] && (
          <button
            style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
            onClick={() => onInputSubmit(step.id, inputConf.name)}
          >
            Confirm
          </button>
        )}
      </div>
    );
  }

  if (isTyping && idx === idx) {
    return <MessageBubble key={key + '-typing'} text={<LoadingIndicator size="small" message="Thinking..." />} senderType="bot" role="BUYER" />;
  }

  if (step.type === "sanitized" && step.fieldName) {
    return (
      <MessageBubble
        key={key}
        text={
          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0001' }}>
            <div style={{ marginBottom: 8, color: '#0f766e', fontWeight: 600 }}>This is what you wanted?</div>
            <div style={{ marginBottom: 12, fontStyle: 'italic' }}>{step.sanitizedValue}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                onClick={() => onSanitizedConfirm(step.fieldName!, step.sanitizedValue!)}
              >
                Confirm
              </button>
              <button
                style={{ background: '#fff', color: '#0f766e', border: '1px solid #0f766e', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                onClick={() => onSanitizedReformulate(step.fieldName!)}
              >
                Reformulate
              </button>
            </div>
          </div>
        }
        senderType="bot"
        role="BUYER"
      />
    );
  }

  return null;
}
