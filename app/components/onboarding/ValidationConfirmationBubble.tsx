import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface ValidationConfirmationBubbleProps {
  validationResult: {
    isValid: boolean;
    checks: {
      inappropriate: boolean;
      offTopic: boolean;
      aiValidation: boolean;
    };
    errors: string[];
    warnings: string[];
    sanitizedValue: string;
    naturalSummary: string;
    extractedData?: string;
  };
  onConfirm: () => void;
  onReformulate: () => void;
  fieldName: string;
}

const ValidationConfirmationBubble: React.FC<ValidationConfirmationBubbleProps> = ({
  validationResult,
  onConfirm,
  onReformulate,
  fieldName
}) => {
  const { isValid, checks, errors, warnings, sanitizedValue, naturalSummary } = validationResult;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      border: isValid ? '2px solid #10b981' : '2px solid #ef4444',
      borderRadius: '16px',
      padding: '20px',
      margin: '16px 0',
      boxShadow: isValid 
        ? '0 8px 32px rgba(16, 185, 129, 0.2)' 
        : '0 8px 32px rgba(239, 68, 68, 0.2)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Success/Error Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '16px'
      }}>
        {isValid ? (
          <CheckCircle size={24} color="#10b981" />
        ) : (
          <XCircle size={24} color="#ef4444" />
        )}
        <h3 style={{
          color: isValid ? '#10b981' : '#ef4444',
          fontSize: '18px',
          fontWeight: '600',
          margin: 0
        }}>
          {isValid ? '✅ Validation Passed' : '❌ Validation Failed'}
        </h3>
      </div>

      {/* Validation Checks Status */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: checks.inappropriate ? '#10b98120' : '#ef444420',
          borderRadius: '8px',
          border: `1px solid ${checks.inappropriate ? '#10b981' : '#ef4444'}`
        }}>
          {checks.inappropriate ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <span style={{
            color: checks.inappropriate ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Content Appropriate
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: checks.offTopic ? '#10b98120' : '#f59e0b20',
          borderRadius: '8px',
          border: `1px solid ${checks.offTopic ? '#10b981' : '#f59e0b'}`
        }}>
          {checks.offTopic ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <AlertCircle size={16} color="#f59e0b" />
          )}
          <span style={{
            color: checks.offTopic ? '#10b981' : '#f59e0b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            On-Topic Content
          </span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: checks.aiValidation ? '#10b98120' : '#ef444420',
          borderRadius: '8px',
          border: `1px solid ${checks.aiValidation ? '#10b981' : '#ef4444'}`
        }}>
          {checks.aiValidation ? (
            <CheckCircle size={16} color="#10b981" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          )}
          <span style={{
            color: checks.aiValidation ? '#10b981' : '#ef4444',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            AI Validation
          </span>
        </div>
      </div>

      {/* Errors and Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div style={{ marginBottom: '16px' }}>
          {errors.map((error, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: '#ef444420',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #ef4444'
            }}>
              <XCircle size={16} color="#ef4444" />
              <span style={{ color: '#ef4444', fontSize: '14px' }}>
                {error}
              </span>
            </div>
          ))}
          
          {warnings.map((warning, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              background: '#f59e0b20',
              borderRadius: '8px',
              marginBottom: '8px',
              border: '1px solid #f59e0b'
            }}>
              <AlertCircle size={16} color="#f59e0b" />
              <span style={{ color: '#f59e0b', fontSize: '14px' }}>
                {warning}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Sanitized Value Display */}
      {isValid && sanitizedValue && (
        <div style={{
          background: '#10b98110',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Processed {fieldName}:
          </div>
          <div style={{
            color: '#e5e5e5',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            "{sanitizedValue}"
          </div>
        </div>
      )}

      {/* Natural Summary */}
      {isValid && naturalSummary && (
        <div style={{
          background: '#1f293720',
          border: '1px solid #374151',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            color: '#10b981',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Confirmation:
          </div>
          <div style={{
            color: '#e5e5e5',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            {naturalSummary}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        <button
          onClick={onReformulate}
          style={{
            background: 'transparent',
            border: '2px solid #6b7280',
            color: '#9ca3af',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#9ca3af';
            e.currentTarget.style.color = '#d1d5db';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = '#6b7280';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          Reformulate
        </button>
        
        {isValid && (
          <button
            onClick={onConfirm}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)';
            }}
          >
            ✓ Confirm & Continue
          </button>
        )}
      </div>

      {/* Success Animation Overlay */}
      {isValid && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(16, 185, 129, 0.1) 50%, transparent 70%)',
          animation: 'shimmer 2s infinite',
          pointerEvents: 'none'
        }} />
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default ValidationConfirmationBubble;
