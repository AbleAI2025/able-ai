/**
 * DataToggleOptions.tsx
 * 
 * Toggle component that allows users to choose between using existing profile data
 * or entering new data for specific fields in the manual onboarding form.
 * This provides flexibility for users who want to update specific parts of their profile.
 */

import React from 'react';
import styles from './DataToggleOptions.module.css';

export interface ExistingData {
  about?: string;
  skills?: string;
  location?: any;
  availability?: any;
  experience?: string;
  qualifications?: string;
  equipment?: string;
  hourlyRate?: number;
  videoIntro?: string;
}

export interface DataToggleOptionsProps {
  existingData: ExistingData;
  selectedOptions: {
    about: 'existing' | 'new';
    skills: 'existing' | 'new';
    location: 'existing' | 'new';
    availability: 'existing' | 'new';
    experience: 'existing' | 'new';
    qualifications: 'existing' | 'new';
    equipment: 'existing' | 'new';
    hourlyRate: 'existing' | 'new';
    videoIntro: 'existing' | 'new';
  };
  onToggleChange: (field: string, option: 'existing' | 'new') => void;
  disabled?: boolean;
}

const DataToggleOptions: React.FC<DataToggleOptionsProps> = ({
  existingData,
  selectedOptions,
  onToggleChange,
  disabled = false
}) => {
  const toggleFields = [
    {
      key: 'about',
      label: 'Bio/About',
      description: 'Your personal description and background',
      existingValue: existingData.about
    },
    {
      key: 'skills',
      label: 'Skills',
      description: 'Your professional skills and expertise',
      existingValue: existingData.skills
    },
    {
      key: 'experience',
      label: 'Experience',
      description: 'Your years of experience',
      existingValue: existingData.experience
    },
    {
      key: 'location',
      label: 'Location',
      description: 'Your work location',
      existingValue: existingData.location ? `${existingData.location.address || 'Location selected'}` : null
    },
    {
      key: 'availability',
      label: 'Availability',
      description: 'Your weekly schedule',
      existingValue: existingData.availability ? 'Schedule configured' : null
    },
    {
      key: 'qualifications',
      label: 'Qualifications',
      description: 'Your certifications and qualifications',
      existingValue: existingData.qualifications
    },
    {
      key: 'equipment',
      label: 'Equipment',
      description: 'Tools and equipment you have',
      existingValue: existingData.equipment
    },
    {
      key: 'hourlyRate',
      label: 'Hourly Rate',
      description: 'Your preferred hourly rate',
      existingValue: existingData.hourlyRate ? `£${existingData.hourlyRate}` : null
    },
    {
      key: 'videoIntro',
      label: 'Video Introduction',
      description: 'Your introduction video',
      existingValue: existingData.videoIntro ? 'Video uploaded' : null
    }
  ];

  const truncateText = (text: string | null | undefined, maxLength: number = 50): string => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Choose Your Data Sources</h3>
        <p className={styles.subtitle}>
          For each field, choose whether to use your existing data or enter new information
        </p>
      </div>

      <div className={styles.toggleGrid}>
        {toggleFields.map((field) => {
          const hasExistingData = !!field.existingValue;
          const isSelected = selectedOptions[field.key as keyof typeof selectedOptions];
          
          return (
            <div key={field.key} className={styles.toggleItem}>
              <div className={styles.fieldHeader}>
                <h4 className={styles.fieldLabel}>{field.label}</h4>
                <p className={styles.fieldDescription}>{field.description}</p>
              </div>

              {hasExistingData && (
                <div className={styles.existingDataPreview}>
                  <div className={styles.existingDataLabel}>Existing:</div>
                  <div className={styles.existingDataValue}>
                    {truncateText(field.existingValue)}
                  </div>
                </div>
              )}

              <div className={styles.toggleContainer}>
                <div className={styles.toggleOptions}>
                  <button
                    type="button"
                    className={`${styles.toggleOption} ${
                      isSelected === 'existing' ? styles.toggleOptionActive : ''
                    } ${!hasExistingData ? styles.toggleOptionDisabled : ''}`}
                    onClick={() => onToggleChange(field.key, 'existing')}
                    disabled={disabled || !hasExistingData}
                    title={!hasExistingData ? 'No existing data available' : 'Use existing data'}
                  >
                    <div className={styles.toggleOptionContent}>
                      <div className={styles.toggleOptionIcon}>
                        {hasExistingData ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" fill="currentColor"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor"/>
                          </svg>
                        )}
                      </div>
                      <div className={styles.toggleOptionText}>
                        <div className={styles.toggleOptionTitle}>
                          {hasExistingData ? 'Use Existing' : 'No Data'}
                        </div>
                        <div className={styles.toggleOptionSubtitle}>
                          {hasExistingData ? 'Keep current data' : 'No existing data'}
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`${styles.toggleOption} ${
                      isSelected === 'new' ? styles.toggleOptionActive : ''
                    }`}
                    onClick={() => onToggleChange(field.key, 'new')}
                    disabled={disabled}
                    title="Enter new data"
                  >
                    <div className={styles.toggleOptionContent}>
                      <div className={styles.toggleOptionIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/>
                        </svg>
                      </div>
                      <div className={styles.toggleOptionText}>
                        <div className={styles.toggleOptionTitle}>Enter New</div>
                        <div className={styles.toggleOptionSubtitle}>Update with new data</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryTitle}>Summary</div>
        <div className={styles.summaryStats}>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>
              {Object.values(selectedOptions).filter(option => option === 'existing').length}
            </span>
            <span className={styles.summaryStatLabel}>Using Existing</span>
          </div>
          <div className={styles.summaryStat}>
            <span className={styles.summaryStatNumber}>
              {Object.values(selectedOptions).filter(option => option === 'new').length}
            </span>
            <span className={styles.summaryStatLabel}>Entering New</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataToggleOptions;
