import React from 'react';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

const sizes = {
  small: {
    dot: 6,
    spacing: 3,
  },
  medium: {
    dot: 8,
    spacing: 4,
  },
  large: {
    dot: 10,
    spacing: 5,
  },
};

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Processing...', 
  size = 'medium' 
}) => {
  const { dot, spacing } = sizes[size];
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      padding: '8px'
    }}>
      <div style={{ display: 'flex', gap: `${spacing}px` }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: `${dot}px`,
              height: `${dot}px`,
              backgroundColor: '#0f766e',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`
            }}
          />
        ))}
      </div>
      {message && (
        <span style={{ 
          color: '#0f766e',
          fontSize: size === 'small' ? '12px' : size === 'medium' ? '14px' : '16px',
          fontWeight: 500
        }}>
          {message}
        </span>
      )}
      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.3;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
