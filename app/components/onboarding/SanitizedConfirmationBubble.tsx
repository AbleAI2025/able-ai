import React from 'react';
import Image from 'next/image';

interface SanitizedConfirmationBubbleProps {
  fieldName: string;
  sanitizedValue: string | unknown;
  originalValue?: string | unknown;
  onConfirm: (fieldName: string, sanitized: string | unknown) => void;
  onReformulate?: (fieldName: string) => void;
  showReformulate?: boolean;
  isProcessing?: boolean;
  role?: 'BUYER' | 'GIG_WORKER';
}

const SanitizedConfirmationBubble: React.FC<SanitizedConfirmationBubbleProps> = ({
  fieldName,
  sanitizedValue,
  originalValue,
  onConfirm,
  onReformulate,
  showReformulate = false,
  isProcessing: externalIsProcessing = false,
  role = 'BUYER'
}) => {
  const [internalIsProcessing, setInternalIsProcessing] = React.useState(false);
  const isProcessing = externalIsProcessing || internalIsProcessing;

  // Determine colors based on role
  const isBuyer = role === 'BUYER';
  const primaryColor = isBuyer ? 'var(--secondary-color)' : 'var(--primary-color)';
  const primaryDarkerColor = isBuyer ? 'var(--secondary-darker-color)' : 'var(--primary-darker-color)';
  const primaryColorRgba = isBuyer ? 'rgba(34, 211, 238, ' : 'rgba(65, 161, 232, ';
  const primaryDarkerColorRgba = isBuyer ? 'rgba(6, 182, 212, ' : 'rgba(37, 99, 235, ';

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

  const formatSanitizedValue = (value: any): string => {
    // Handle coordinate objects
    if (value && typeof value === 'object' && 'lat' in value && 'lng' in value) {
      const lat = value.lat;
      const lng = value.lng;
      const latStr = typeof lat === 'number' ? lat.toFixed(6) : String(lat);
      const lngStr = typeof lng === 'number' ? lng.toFixed(6) : String(lng);
      return `Lat: ${latStr}, Lng: ${lngStr}`;
    } 
    
    // Handle string that might contain coordinates
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lng' in parsed) {
          const lat = parsed.lat;
          const lng = parsed.lng;
          const latStr = typeof lat === 'number' ? lat.toFixed(6) : String(lat);
          const lngStr = typeof lng === 'number' ? lng.toFixed(6) : String(lng);
          return `Lat: ${latStr}, Lng: ${lngStr}`;
        }
      } catch (e) {
        // Not JSON, return as string
      }
      return value;
    }
    
    // Handle other objects
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    // Handle other types
    return String(value || '');
  };

  return (
    <div>
      {/* AI Avatar - Separated */}
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
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryDarkerColor})`,
            boxShadow: `0 2px 8px ${primaryColorRgba}0.3)`
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

      {/* Content - Separated */}
      <div style={{ 
        background: '#1a1a1a', 
        borderRadius: 12, 
        padding: 16, 
        margin: '16px 0', 
        boxShadow: `0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1)`, 
        border: `2px solid ${primaryColor}`,
        animation: 'slideInScalePrimary 0.6s ease-out',
        opacity: 0,
        animationFillMode: 'forwards',
        transform: 'scale(0.95)',
        transformOrigin: 'center',
        position: 'relative'
      }}>
        <style>{`
          @keyframes slideInPrimary {
            from {
              opacity: 0;
              transform: translateY(10px);
              filter: drop-shadow(0 0 0 ${primaryColorRgba}0));
            }
            to {
              opacity: 1;
              transform: translateY(0);
              filter: drop-shadow(0 0 8px ${primaryColorRgba}0.3));
            }
          }
          
          @keyframes slideInScalePrimary {
            0% {
              opacity: 0;
              transform: scale(0.95) translateY(20px);
              box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.1), 0 0 0 1px ${primaryDarkerColorRgba}0.05);
            }
            50% {
              opacity: 0.8;
              transform: scale(1.02) translateY(-2px);
              box-shadow: 0 8px 30px ${primaryDarkerColorRgba}0.4), 0 0 0 2px ${primaryDarkerColorRgba}0.2);
            }
            100% {
              opacity: 1;
              transform: scale(1) translateY(0);
              box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1);
            }
          }
          
          @keyframes primaryPulse {
            0%, 100% {
              box-shadow: 0 4px 20px ${primaryDarkerColorRgba}0.3), 0 0 0 1px ${primaryDarkerColorRgba}0.1);
            }
            50% {
              box-shadow: 0 6px 25px ${primaryDarkerColorRgba}0.5), 0 0 0 2px ${primaryDarkerColorRgba}0.2);
            }
          }
        `}</style>
        <div style={{ 
          marginBottom: 16, 
          fontStyle: 'italic',
          color: '#ffffff', 
          fontSize: '15px', 
          lineHeight: 1.4,
          fontWeight: 600
        }}>
          {formatSanitizedValue(sanitizedValue)}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            style={{ 
              background: primaryColor, 
              color: '#fff', 
              border: 'none', 
              borderRadius: 8, 
              padding: '8px 16px', 
              fontWeight: 600, 
              fontSize: '14px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              transition: 'background-color 0.2s',
              opacity: isProcessing ? 0.6 : 1
            }}
            onClick={handleConfirm}
            disabled={isProcessing}
            onMouseOver={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = primaryDarkerColor;
              }
            }}
            onMouseOut={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = primaryColor;
              }
            }}
          >
            {isProcessing ? 'Processing...' : 'Confirm'}
          </button>
          {onReformulate && (
            <button
              style={{ 
                background: 'transparent', 
                color: primaryColor, 
                border: `1px solid ${primaryColor}`, 
                borderRadius: 8, 
                padding: '8px 16px', 
                fontWeight: 600, 
                fontSize: '14px', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', 
                transition: 'all 0.2s',
                opacity: isProcessing ? 0.6 : 1
              }}
              onClick={handleReformulate}
              disabled={isProcessing}
              onMouseOver={(e) => { 
                if (!isProcessing) {
                  e.currentTarget.style.background = primaryColor; 
                  e.currentTarget.style.color = '#fff'; 
                }
              }}
              onMouseOut={(e) => { 
                if (!isProcessing) {
                  e.currentTarget.style.background = 'transparent'; 
                  e.currentTarget.style.color = primaryColor; 
                }
              }}
            >
                              {fieldName === 'videoIntro' ? 'Re-shoot' : 'Edit'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SanitizedConfirmationBubble;