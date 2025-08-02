import React from 'react';

interface SanitizedConfirmationBubbleProps {
  fieldName: string;
  sanitizedValue: string | unknown;
  originalValue?: string | unknown;
  onConfirm: (fieldName: string, sanitized: string | unknown) => void;
  onReformulate?: (fieldName: string) => void;
  showReformulate?: boolean;
  isProcessing?: boolean;
}

const SanitizedConfirmationBubble: React.FC<SanitizedConfirmationBubbleProps> = ({
  fieldName,
  sanitizedValue,
  originalValue,
  onConfirm,
  onReformulate,
  showReformulate = false,
  isProcessing: externalIsProcessing = false
}) => {
  const [internalIsProcessing, setInternalIsProcessing] = React.useState(false);
  const isProcessing = externalIsProcessing || internalIsProcessing;

  const handleConfirm = () => {
    if (isProcessing) return;
    setInternalIsProcessing(true);
    onConfirm(fieldName, sanitizedValue);
  };

  const handleReformulate = () => {
    if (isProcessing) return;
    setInternalIsProcessing(true);
    onReformulate?.(fieldName);
  };
  return (
    <div style={{ 
      background: '#1a1a1a', 
      borderRadius: 12, 
      padding: 16, 
      margin: '16px 0', 
      boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)', 
      border: '1px solid #0f766e',
      animation: 'slideInScale 0.5s ease-out',
      opacity: 0,
      animationFillMode: 'forwards',
      transform: 'scale(0.95)',
      transformOrigin: 'center'
    }}>
      <style>{`
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
      <div style={{ 
        marginBottom: 8, 
        color: '#0f766e', 
        fontWeight: 600, 
        fontSize: '14px' 
      }}>
        This is what you wanted?
      </div>
             <div style={{ 
         marginBottom: 16, 
         fontStyle: 'italic', 
         color: '#e5e5e5', 
         fontSize: '15px', 
         lineHeight: '1.4' 
       }}>
         {(() => {
           if (typeof sanitizedValue === 'object' && sanitizedValue !== null) {
             // Handle coordinate objects
             if ('lat' in sanitizedValue && 'lng' in sanitizedValue) {
               return `Lat: ${(sanitizedValue as { lat: number; lng: number }).lat.toFixed(6)}, Lng: ${(sanitizedValue as { lat: number; lng: number }).lng.toFixed(6)}`;
             }
             return JSON.stringify(sanitizedValue);
           }
           
           const valueStr = String(sanitizedValue || '');
           
           // Check if this is a video URL
           if (typeof sanitizedValue === 'string' && sanitizedValue.startsWith('http') && 
               (sanitizedValue.includes('.webm') || sanitizedValue.includes('.mp4') || sanitizedValue.includes('.mov'))) {
             return (
               <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                 <span style={{ color: '#0f766e', fontWeight: 600 }}>Video uploaded ✓</span>
                 <video 
                   controls 
                   style={{ 
                     maxWidth: '100%', 
                     maxHeight: '200px', 
                     borderRadius: '8px',
                     border: '1px solid #333'
                   }}
                   preload="metadata"
                 >
                   <source src={sanitizedValue} type="video/webm" />
                   <source src={sanitizedValue} type="video/mp4" />
                   Your browser does not support the video tag.
                 </video>
               </div>
             );
           }
           
           return valueStr;
         })()}
       </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          style={{ 
            background: isProcessing ? '#555' : '#0f766e', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 8, 
            padding: '8px 16px', 
            fontWeight: 600, 
            fontSize: '14px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer', 
            transition: 'all 0.3s ease',
            transform: 'scale(1)',
            opacity: isProcessing ? 0.6 : 1
          }}
          onClick={handleConfirm}
          disabled={isProcessing}
          onMouseOver={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.background = '#0d5a52';
              e.currentTarget.style.transform = 'scale(1.05)';
            }
          }}
          onMouseOut={(e) => {
            if (!isProcessing) {
              e.currentTarget.style.background = '#0f766e';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          {isProcessing ? 'Processing...' : 'Confirm'}
        </button>
        {showReformulate && onReformulate && (
          <button
            style={{ 
              background: isProcessing ? '#555' : 'transparent', 
              color: isProcessing ? '#999' : '#0f766e', 
              border: '1px solid #0f766e', 
              borderRadius: 8, 
              padding: '8px 16px', 
              fontWeight: 600, 
              fontSize: '14px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              transition: 'all 0.3s ease',
              transform: 'scale(1)',
              opacity: isProcessing ? 0.6 : 1
            }}
            onClick={handleReformulate}
            disabled={isProcessing}
            onMouseOver={(e) => { 
              if (!isProcessing) {
                e.currentTarget.style.background = '#0f766e'; 
                e.currentTarget.style.color = '#fff'; 
                e.currentTarget.style.transform = 'scale(1.05)';
              }
            }}
            onMouseOut={(e) => { 
              if (!isProcessing) {
                e.currentTarget.style.background = 'transparent'; 
                e.currentTarget.style.color = '#0f766e'; 
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Reformulate'}
          </button>
        )}
      </div>
    </div>
  );
};

export default SanitizedConfirmationBubble;