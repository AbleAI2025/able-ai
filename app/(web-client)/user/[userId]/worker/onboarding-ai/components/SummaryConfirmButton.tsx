import React from 'react';

type Props = {
  isSubmitting: boolean;
  onClick: () => Promise<void> | void;
};

const SummaryConfirmButton: React.FC<Props> = ({ isSubmitting, onClick }) => (
  <button
    style={{ 
      marginTop: 16, 
      background: isSubmitting ? '#666' : 'var(--primary-color)', 
      color: '#fff', 
      border: 'none', 
      borderRadius: 8, 
      padding: '8px 16px', 
      fontWeight: 600,
      transition: 'all 0.3s ease',
      transform: 'scale(1)',
      animation: isSubmitting ? 'none' : 'pulse 2s infinite',
      cursor: isSubmitting ? 'not-allowed' : 'pointer'
    }}
    disabled={isSubmitting}
    onClick={onClick}
    onMouseOver={(e) => {
      if (!isSubmitting) {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.background = 'var(--primary-darker-color)';
      }
    }}
    onMouseOut={(e) => {
      if (!isSubmitting) {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.background = 'var(--primary-color)';
      }
    }}
  >
    <style>{`
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
        100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
      }
    `}</style>
    {isSubmitting ? 'Saving Profile...' : 'Confirm & Go to Dashboard'}
  </button>
);

export default SummaryConfirmButton;


