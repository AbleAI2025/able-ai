import React from 'react';

interface PromoCodeStepProps {
  onHaveCode: () => void;
  onDontHaveCode: () => void;
  disabled?: boolean;
  selectedOption?: 'haveCode' | 'noCode' | null;
}

export default function PromoCodeStep({ onHaveCode, onDontHaveCode, disabled = false, selectedOption = null }: PromoCodeStepProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
      <button
        onClick={onHaveCode}
        disabled={disabled}
        style={{
          background: selectedOption === 'haveCode' ? '#6b7280' : 'var(--primary-color)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
          minWidth: '140px',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        I Have a Code
      </button>
      
      <button
        onClick={onDontHaveCode}
        disabled={disabled}
        style={{
          background: selectedOption === 'noCode' ? '#6b7280' : 'transparent',
          color: selectedOption === 'noCode' ? '#fff' : 'var(--primary-color)',
          border: '2px solid var(--primary-color)',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 600,
          fontSize: '14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          minWidth: '140px',
          opacity: disabled ? 0.6 : 1
        }}
        onMouseOver={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = 'var(--primary-color)';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = selectedOption === 'noCode' ? '#6b7280' : 'transparent';
            e.currentTarget.style.color = selectedOption === 'noCode' ? '#fff' : 'var(--primary-color)';
          }
        }}
      >
        No Code
      </button>
    </div>
  );
}
