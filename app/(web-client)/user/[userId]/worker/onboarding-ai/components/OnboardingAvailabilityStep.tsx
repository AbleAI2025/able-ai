"use client";

import React, { useState } from "react";
import { AvailabilityFormData } from "@/app/types/AvailabilityTypes";
import styles from "./OnboardingAvailabilityStep.module.css";

interface OnboardingAvailabilityStepProps {
  currentAvailability: AvailabilityFormData;
  onAvailabilityChange: (availability: AvailabilityFormData) => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

const OnboardingAvailabilityStep: React.FC<OnboardingAvailabilityStepProps> = ({
  currentAvailability,
  onAvailabilityChange,
  onConfirm,
  isSubmitting = false,
}) => {
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  const weekDays = [
    { value: 'Mon', label: 'Monday' },
    { value: 'Tue', label: 'Tuesday' },
    { value: 'Wed', label: 'Wednesday' },
    { value: 'Thu', label: 'Thursday' },
    { value: 'Fri', label: 'Friday' },
    { value: 'Sat', label: 'Saturday' },
    { value: 'Sun', label: 'Sunday' }
  ];

  const handleDayToggle = (day: string) => {
    const newDays = currentAvailability.days.includes(day)
      ? currentAvailability.days.filter(d => d !== day)
      : [...currentAvailability.days, day];
    
    onAvailabilityChange({
      ...currentAvailability,
      days: newDays
    });
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    onAvailabilityChange({
      ...currentAvailability,
      [field]: value
    });
  };

  const handleRepeatSave = (data: AvailabilityFormData) => {
    onAvailabilityChange(data);
    setShowRepeatModal(false);
  };

  const getPreviewText = () => {
    if (currentAvailability.days.length === 0) {
      return 'Please select days and times';
    }

    const daysText = currentAvailability.days.map(day => 
      weekDays.find(d => d.value === day)?.label
    ).join(', ');

    const frequencyText = currentAvailability.frequency === 'never' 
      ? '' 
      : currentAvailability.frequency === 'weekly' 
        ? ' (Every week)'
        : currentAvailability.frequency === 'biweekly'
          ? ' (Every 2 weeks)'
          : ' (Every month)';

    const endText = currentAvailability.ends === 'on_date' && currentAvailability.endDate
      ? ` until ${new Date(currentAvailability.endDate).toLocaleDateString()}`
      : currentAvailability.ends === 'after_occurrences' && currentAvailability.occurrences
        ? ` (${currentAvailability.occurrences} times)`
        : '';

    return `${daysText} ${currentAvailability.startTime} - ${currentAvailability.endTime}${frequencyText}${endText}`;
  };

  return (
    <>
      <div className={styles.availabilityContainer}>
        <h3 className={styles.title}>
          Set Your Weekly Availability
        </h3>
        
        <div className={styles.section}>
          <label className={styles.label}>
            Available Days *
          </label>
          <div className={styles.daysGrid}>
            {weekDays.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`${styles.dayButton} ${
                  currentAvailability.days.includes(day.value) ? styles.dayButtonSelected : ''
                }`}
                onClick={() => handleDayToggle(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Available Hours *
          </label>
          <div className={styles.timeRow}>
            <div className={styles.timeGroup}>
              <label className={styles.timeLabel}>From:</label>
              <input
                type="time"
                className={styles.timeInput}
                value={currentAvailability.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
              />
            </div>
            <div className={styles.timeGroup}>
              <label className={styles.timeLabel}>To:</label>
              <input
                type="time"
                className={styles.timeInput}
                value={currentAvailability.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Recurring Pattern
          </label>
          <div 
            className={styles.recurrenceRow}
            onClick={() => setShowRepeatModal(true)}
          >
            <span className={styles.recurrenceText}>
              {currentAvailability.frequency === 'never' 
                ? (currentAvailability.endDate 
                    ? `Single occurrence on ${new Date(currentAvailability.endDate).toLocaleDateString()}`
                    : 'Single occurrence')
                : `Repeats ${currentAvailability.days.join(', ')} every ${
                    currentAvailability.frequency === 'weekly' ? 'week' : 
                    currentAvailability.frequency === 'biweekly' ? '2 weeks' : 'month'
                  }`
              }
            </span>
            <span className={styles.arrow}>›</span>
          </div>
        </div>

        <div className={styles.preview}>
          <strong>Preview:</strong> {getPreviewText()}
        </div>

        <div className={styles.actions}>
          <button
            className={styles.confirmButton}
            onClick={onConfirm}
            disabled={isSubmitting || currentAvailability.days.length === 0}
          >
            {isSubmitting ? 'Saving...' : 'Confirm Availability'}
          </button>
        </div>
      </div>

      {/* Repeat Modal */}
      {showRepeatModal && (
        <RepeatAvailabilityModal
          isOpen={showRepeatModal}
          onClose={() => setShowRepeatModal(false)}
          formData={currentAvailability}
          onSave={handleRepeatSave}
        />
      )}
    </>
  );
};

// Repeat Availability Modal Component (simplified for onboarding)
interface RepeatAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AvailabilityFormData;
  onSave: (data: AvailabilityFormData) => void;
}

const RepeatAvailabilityModal: React.FC<RepeatAvailabilityModalProps> = ({
  isOpen,
  onClose,
  formData,
  onSave,
}) => {
  const [localData, setLocalData] = useState<AvailabilityFormData>(formData);

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const fullDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleDayToggle = (day: string) => {
    const fullDayName = fullDayNames[dayNames.indexOf(day)];
    setLocalData(prev => ({
      ...prev,
      days: prev.days.includes(fullDayName)
        ? prev.days.filter(d => d !== fullDayName)
        : [...prev.days, fullDayName]
    }));
  };

  const handleSave = () => {
    onSave(localData);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.repeatModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.repeatHeader}>
          <h3>Repeat availability</h3>
        </div>

        <div className={styles.repeatContent}>
          <div className={styles.daysSection}>
            <label className={styles.sectionLabel}>Days</label>
            <div className={styles.daysGrid}>
              {dayNames.map((day, index) => {
                const fullDayName = fullDayNames[index];
                const isSelected = localData.days.includes(fullDayName);
                return (
                  <button
                    key={`day-${index}`}
                    className={`${styles.dayButton} ${isSelected ? styles.dayButtonSelected : ''}`}
                    onClick={() => handleDayToggle(day)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.frequencySection}>
            <label className={styles.sectionLabel}>Frequency</label>
            <select
              className={styles.frequencySelect}
              value={localData.frequency}
              onChange={(e) => setLocalData(prev => ({ 
                ...prev, 
                frequency: e.target.value as 'never' | 'weekly' | 'biweekly' | 'monthly' 
              }))}
            >
              <option value="never">No repeat</option>
              <option value="weekly">Every week</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Every month</option>
            </select>
          </div>

          <div className={styles.endsSection}>
            <label className={styles.sectionLabel}>Ends</label>
            <select
              className={styles.endsSelect}
              value={localData.ends}
              onChange={(e) => setLocalData(prev => ({ 
                ...prev, 
                ends: e.target.value as 'never' | 'on_date' | 'after_occurrences' 
              }))}
            >
              <option value="never">Never</option>
              <option value="on_date">On date</option>
              <option value="after_occurrences">After occurrences</option>
            </select>
          </div>

          {localData.ends === 'on_date' && (
            <div className={styles.dateSection}>
              <label className={styles.sectionLabel}>End Date</label>
              <input
                type="date"
                className={styles.dateInput}
                value={localData.endDate || ''}
                onChange={(e) => setLocalData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          )}

          {localData.ends === 'after_occurrences' && (
            <div className={styles.occurrencesSection}>
              <label className={styles.sectionLabel}>Occurrences</label>
              <input
                type="number"
                className={styles.occurrencesInput}
                value={localData.occurrences || 1}
                onChange={(e) => setLocalData(prev => ({ 
                  ...prev, 
                  occurrences: parseInt(e.target.value) || 1 
                }))}
                min="1"
              />
            </div>
          )}

          <div className={styles.summary}>
            {localData.frequency === 'never' 
              ? 'Single occurrence'
              : `Repeats ${localData.days.join(', ')} every ${
                  localData.frequency === 'weekly' ? 'week' : 
                  localData.frequency === 'biweekly' ? '2 weeks' : 'month'
                }`
            }
          </div>
        </div>

        <div className={styles.repeatActions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingAvailabilityStep;
