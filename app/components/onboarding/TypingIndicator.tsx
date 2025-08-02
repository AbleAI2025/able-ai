import React from 'react';

interface TypingIndicatorProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  color = '#0f766e', 
  size = 'medium' 
}) => {
  const dotSize = size === 'small' ? '4px' : size === 'large' ? '8px' : '6px';
  const animationDelay = size === 'small' ? '0.15s' : size === 'large' ? '0.3s' : '0.2s';

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '8px 16px', 
      color: color, 
      fontWeight: 600 
    }}>
      <span 
        className="typing-dot" 
        style={{ 
          animation: `blink 1s infinite`,
          fontSize: dotSize,
          marginRight: '2px'
        }}
      >
        .
      </span>
      <span 
        className="typing-dot" 
        style={{ 
          animation: `blink 1s infinite ${animationDelay}`,
          fontSize: dotSize,
          marginRight: '2px'
        }}
      >
        .
      </span>
      <span 
        className="typing-dot" 
        style={{ 
          animation: `blink 1s infinite ${parseFloat(animationDelay) * 2}s`,
          fontSize: dotSize
        }}
      >
        .
      </span>
      <style>{`
        @keyframes blink { 
          0%, 80%, 100% { opacity: 0.2; } 
          40% { opacity: 1; } 
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;