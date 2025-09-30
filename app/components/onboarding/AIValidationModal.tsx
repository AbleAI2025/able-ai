import React from 'react';
import styles from './AIValidationModal.module.css';

interface AIValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onReject: () => void;
  fieldName: string;
  originalValue: string;
  sanitizedValue: string;
  isSubmitting?: boolean;
}

const AIValidationModal: React.FC<AIValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onReject,
  fieldName,
  originalValue,
  sanitizedValue,
  isSubmitting = false
}) => {
  if (!isOpen) return null;

  const getFieldDisplayName = (field: string) => {
    switch (field) {
      case 'about': return 'Bio/About';
      case 'skills': return 'Skills';
      case 'experience': return 'Experience';
      case 'qualifications': return 'Qualifications';
      case 'equipment': return 'Equipment';
      default: return field;
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>AI Content Improvement</h3>
          <p>I've cleaned up your {getFieldDisplayName(fieldName)} to make it more professional:</p>
        </div>
        
        <div className={styles.comparisonContainer}>
          <div className={styles.originalSection}>
            <h4>Your Original:</h4>
            <div className={styles.contentBox}>
              {originalValue}
            </div>
          </div>
          
          <div className={styles.arrow}>→</div>
          
          <div className={styles.sanitizedSection}>
            <h4>AI Improved:</h4>
            <div className={styles.contentBox}>
              {sanitizedValue}
            </div>
          </div>
        </div>
        
        <div className={styles.modalActions}>
          <button 
            className={styles.rejectButton}
            onClick={onReject}
            disabled={isSubmitting}
          >
            Keep Original
          </button>
          <button 
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            Use AI Version
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIValidationModal;
