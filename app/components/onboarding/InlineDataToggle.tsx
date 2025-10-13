/**
 * InlineDataToggle.tsx
 * 
 * Small inline toggle component that appears next to field labels
 * allowing users to choose between using existing data or entering new data.
 */

import React from 'react';
import styles from './InlineDataToggle.module.css';

export interface InlineDataToggleProps {
  fieldKey: string;
  hasExistingData: boolean;
  isUsingExisting: boolean;
  onToggle: (fieldKey: string, useExisting: boolean) => void;
  disabled?: boolean;
  existingValue?: string | number | null;
}

const InlineDataToggle: React.FC<InlineDataToggleProps> = ({
  fieldKey,
  hasExistingData,
  isUsingExisting,
  onToggle,
  disabled = false,
  existingValue
}) => {
  const handleToggle = () => {
    if (!disabled && hasExistingData) {
      onToggle(fieldKey, !isUsingExisting);
    }
  };

  const truncateValue = (value: string | number | null, maxLength: number = 20): string => {
    if (!value) return '';
    const stringValue = String(value);
    return stringValue.length > maxLength ? `${stringValue.substring(0, maxLength)}...` : stringValue;
  };

  // Show toggle even if no existing data (for demonstration purposes)
  // if (!hasExistingData) {
  //   return null; // Don't show toggle if no existing data
  // }

  return (
    <div className={styles.inlineToggle}>
      <button
        type="button"
        className={`${styles.toggleButton} ${
          isUsingExisting ? styles.toggleButtonActive : styles.toggleButtonInactive
        } ${disabled ? styles.toggleButtonDisabled : ''} ${!hasExistingData ? styles.toggleButtonNoData : ''}`}
        onClick={handleToggle}
        disabled={disabled}
        title={isUsingExisting ? 'Using existing data - click to enter new' : 'Enter new data - click to use existing'}
      >
        <div className={styles.toggleContent}>
          <div className={styles.toggleIcon}>
            {isUsingExisting ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
              </svg>
            )}
          </div>
          <div className={styles.toggleText}>
            {!hasExistingData ? 'No existing data' : (isUsingExisting ? 'Using existing' : 'Enter new')}
          </div>
        </div>
      </button>
      
      {isUsingExisting && existingValue && (
        <div className={styles.existingPreview}>
          <span className={styles.existingLabel}>Existing:</span>
          <span className={styles.existingValue}>{truncateValue(existingValue)}</span>
        </div>
      )}
    </div>
  );
};

export default InlineDataToggle;
