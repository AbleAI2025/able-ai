import React from 'react';
import styles from '../OnboardingAIPage.module.css';

type Props = {
  isCompleted: boolean;
  confirmClicked: boolean;
  isReformulatingThisField: boolean;
  fieldName: string;
  sanitizedValue: any;
  onConfirm: (field: string, value: any) => void;
  onReformulate: (field: string) => void;
};

const ValidationButtons: React.FC<Props> = ({
  isCompleted,
  confirmClicked,
  isReformulatingThisField,
  fieldName,
  sanitizedValue,
  onConfirm,
  onReformulate,
}) => (
  <div className={styles.validationButtons}>
    <button
      className={`${styles.validationButton} ${isCompleted ? styles.validationButton : ''}`}
      style={{ opacity: isCompleted ? 0.7 : 1 }}
      onClick={isCompleted ? undefined : () => onConfirm(fieldName, sanitizedValue)}
      disabled={isCompleted}
      onMouseOver={(e) => {
        if (!isCompleted) e.currentTarget.style.background = 'var(--primary-darker-color)';
      }}
      onMouseOut={(e) => {
        if (!isCompleted) e.currentTarget.style.background = isCompleted ? '#555' : 'var(--primary-color)';
      }}
    >
      {confirmClicked ? 'Confirmed' : 'Confirm'}
    </button>
    <button
      className={`${styles.validationButtonSecondary} ${isCompleted ? styles.validationButtonSecondary : ''}`}
      style={{ opacity: isCompleted ? 0.7 : 1 }}
      onClick={isCompleted ? undefined : () => onReformulate(fieldName)}
      disabled={isCompleted}
      onMouseOver={(e) => { 
        if (!isCompleted) {
          e.currentTarget.style.background = 'var(--primary-color)'; 
          e.currentTarget.style.color = '#fff'; 
        }
      }}
      onMouseOut={(e) => { 
        if (!isCompleted) {
          e.currentTarget.style.background = 'transparent'; 
          e.currentTarget.style.color = 'var(--primary-color)'; 
        }
      }}
    >
      {isReformulatingThisField ? (fieldName === 'videoIntro' ? 'Re-shooting...' : 'Editing...') : (fieldName === 'videoIntro' ? 'Re-shoot' : 'Edit message')}
    </button>
  </div>
);

export default ValidationButtons;


