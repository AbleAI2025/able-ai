import React from 'react';
import { styles } from '../styles';

interface SanitizedStepProps {
  value: string;
  fieldName: string;
  onConfirm: (fieldName: string, value: string) => void;
  onReformulate: (fieldName: string) => void;
}

export function SanitizedStep({ value, fieldName, onConfirm, onReformulate }: SanitizedStepProps) {
  return (
    <div style={styles.sanitizedStep}>
      <div style={{...styles.sanitizedContent, color: 'var(--secondary-color)', fontWeight: 600}}>{value}</div>
      <div style={styles.buttonContainer}>
        <button
          style={styles.primaryButton}
          onClick={() => onConfirm(fieldName, value)}
        >
          Confirm
        </button>
        <button
          style={styles.secondaryButton}
          onClick={() => onReformulate(fieldName)}
        >
          Reformulate
        </button>
      </div>
    </div>
  );
}
