import React from 'react';
import styles from './DataReviewModal.module.css';

interface DataReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onGoBack: () => void;
  originalData: any;
  cleanedData: any;
  isSubmitting: boolean;
}

const DataReviewModal: React.FC<DataReviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onGoBack,
  originalData,
  cleanedData,
  isSubmitting
}) => {
  if (!isOpen) return null;

  const fieldsToShow = [
    { key: 'about', label: 'About You', isText: true },
    { key: 'skills', label: 'Skills', isText: true },
    { key: 'experience', label: 'Experience', isText: true },
    { key: 'qualifications', label: 'Qualifications', isText: true },
    { key: 'equipment', label: 'Equipment', isText: true },
    { key: 'hourlyRate', label: 'Hourly Rate', isText: false },
    { key: 'location', label: 'Location', isText: false },
    { key: 'availability', label: 'Availability', isText: false }
  ];

  const formatValue = (value: any, isText: boolean) => {
    if (!value) return 'Not provided';
    
    if (isText) {
      return typeof value === 'string' ? value : JSON.stringify(value);
    }
    
    if (typeof value === 'object') {
      if (value.address) return value.address;
      if (value.days) return `${value.days.join(', ')} (${value.startTime} - ${value.endTime})`;
      return JSON.stringify(value);
    }
    
    return String(value);
  };

  const hasChanges = (field: string) => {
    const original = originalData[field];
    const cleaned = cleanedData[field];
    
    if (!original && !cleaned) return false;
    if (!original || !cleaned) return true;
    
    return JSON.stringify(original) !== JSON.stringify(cleaned);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Review Your Data</h2>
          <p className={styles.subtitle}>
            AI has cleaned and formatted some of your information. Review the changes below and choose to submit or go back to edit.
          </p>
        </div>

        <div className={styles.content}>
          <div className={styles.comparisonContainer}>
            {(() => {
              const changedFields = fieldsToShow.filter((field) => hasChanges(field.key));
              
              if (changedFields.length === 0) {
                return (
                  <div className={styles.noChangesMessage}>
                    <p>No changes were made to your data. All information looks good!</p>
                  </div>
                );
              }
              
              return changedFields.map((field) => {
                const originalValue = formatValue(originalData[field.key], field.isText);
                const cleanedValue = formatValue(cleanedData[field.key], field.isText);
                const hasChange = hasChanges(field.key);

                return (
                  <div key={field.key} className={styles.fieldComparison}>
                    <h3 className={styles.fieldLabel}>{field.label}</h3>
                    
                    <div className={styles.comparisonRow}>
                      <div className={styles.column}>
                        <div className={styles.columnHeader}>
                          <span className={styles.columnTitle}>Your Input</span>
                        </div>
                        <div className={styles.valueContainer}>
                          <div className={styles.value}>
                            {originalValue}
                          </div>
                        </div>
                      </div>

                      <div className={styles.arrow}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </div>

                      <div className={styles.column}>
                        <div className={styles.columnHeader}>
                          <span className={styles.columnTitle}>AI Cleaned</span>
                          {hasChange && <span className={styles.changedBadge}>Changed</span>}
                        </div>
                        <div className={styles.valueContainer}>
                          <div className={`${styles.value} ${hasChange ? styles.changedValue : ''}`}>
                            {cleanedValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className={styles.footer}>
          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.goBackButton}
              onClick={onGoBack}
              disabled={isSubmitting}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Go Back & Edit
            </button>
            
            <button
              type="button"
              className={styles.submitButton}
              onClick={onConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.spinner}></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                  Submit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataReviewModal;
