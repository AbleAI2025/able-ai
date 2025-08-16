import React from 'react';
import styles from './SetupChoiceModal.module.css';

interface SetupChoiceModalProps {
  isOpen: boolean;
  onChoice: (choice: 'ai' | 'manual') => void;
  onClose?: () => void;
}

const SetupChoiceModal: React.FC<SetupChoiceModalProps> = ({ 
  isOpen, 
  onChoice, 
  onClose 
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>How would you like to set up your profile?</h2>
          <p className={styles.modalSubtitle}>
            Choose the method that works best for you
          </p>
        </div>

        <div className={styles.choiceContainer}>
          {/* AI-Assisted Option */}
          <div 
            className={styles.choiceCard}
            onClick={() => onChoice('ai')}
          >
            <div className={styles.choiceIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.choiceContent}>
              <h3 className={styles.choiceTitle}>AI-Assisted Setup</h3>
              <p className={styles.choiceDescription}>
                Let our AI guide you through profile creation with a conversational chat experience
              </p>
              <div className={styles.choiceFeatures}>
                <span className={styles.feature}>• Interactive chat experience</span>
                <span className={styles.feature}>• Smart suggestions and guidance</span>
                <span className={styles.feature}>• Estimated time: 5-10 minutes</span>
              </div>
            </div>
            <div className={styles.choiceArrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* Manual Input Option */}
          <div 
            className={styles.choiceCard}
            onClick={() => onChoice('manual')}
          >
            <div className={styles.choiceIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
              </svg>
            </div>
            <div className={styles.choiceContent}>
              <h3 className={styles.choiceTitle}>Manual Form Input</h3>
              <p className={styles.choiceDescription}>
                Fill out the form directly with full control over your profile information
              </p>
              <div className={styles.choiceFeatures}>
                <span className={styles.feature}>• Direct form control</span>
                <span className={styles.feature}>• See all fields at once</span>
                <span className={styles.feature}>• Estimated time: 3-5 minutes</span>
              </div>
            </div>
            <div className={styles.choiceArrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" fill="currentColor"/>
              </svg>
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            💡 You can switch between methods at any time during setup
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupChoiceModal;
