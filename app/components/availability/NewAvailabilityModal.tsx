"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { AvailabilitySlot, AvailabilityFormData } from "@/app/types/AvailabilityTypes";
import styles from "./NewAvailabilityModal.module.css";

interface NewAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot?: AvailabilitySlot | null;
  onSave: (data: AvailabilityFormData) => void;
  onDelete?: () => void;
  selectedDate?: Date;
  selectedTime?: string;
  isEditingSingleOccurrence?: boolean;
}

const NewAvailabilityModal: React.FC<NewAvailabilityModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSave,
  onDelete,
  selectedDate,
  selectedTime,
  isEditingSingleOccurrence = false,
}) => {
  const [formData, setFormData] = useState<AvailabilityFormData>({
    startTime: "09:00",
    endTime: "19:00",
    days: [],
    frequency: "never",
    ends: "never",
  });

  const [showRepeatModal, setShowRepeatModal] = useState(false);

  // Helper function to calculate end time (1 hour after start time)
  const getEndTimeFromStart = (startTime: string): string => {
    const [hour, minute] = startTime.split(':').map(Number);
    const endHour = (hour + 1) % 24;
    return `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (slot) {
      if (isEditingSingleOccurrence && selectedDate) {
        // Editing just one occurrence of a recurring pattern
        setFormData({
          startTime: slot.startTime,
          endTime: slot.endTime,
          days: [], // Empty for single occurrence
          frequency: 'never', // Single occurrence
          ends: 'on_date',
          endDate: selectedDate.toISOString().split('T')[0], // The specific date
          occurrences: undefined,
        });
      } else {
        // Editing the entire recurring pattern
        setFormData({
          startTime: slot.startTime,
          endTime: slot.endTime,
          days: slot.days,
          frequency: slot.frequency,
          ends: slot.ends,
          endDate: slot.endDate,
          occurrences: slot.occurrences,
        });
      }
    } else if (selectedDate) {
      // For single occurrences, store the actual date in the endDate field
      // and use an empty days array to avoid confusion with recurring patterns
      const dateString = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      setFormData(prev => ({
        ...prev,
        days: [], // Empty for single occurrences
        endDate: dateString, // Store the actual date here
        frequency: 'never', // Single occurrence
        // Use selected time if available, otherwise default to 09:00
        startTime: selectedTime || "09:00",
        // Set end time to 1 hour after start time
        endTime: selectedTime ? getEndTimeFromStart(selectedTime) : "19:00",
      }));
    }
  }, [slot, selectedDate, selectedTime, isEditingSingleOccurrence]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const getDayName = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
  };

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getRecurrenceText = () => {
    if (formData.frequency === 'never') {
      if (formData.endDate) {
        const date = new Date(formData.endDate);
        return `Single occurrence on ${date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}`;
      }
      return "Single occurrence (date not specified)";
    }
    
    if (formData.days.length === 0) return "No recurrence set";
    
    const daysText = formData.days.join('-');
    const frequencyText = formData.frequency === 'weekly' ? 'week' : 
                         formData.frequency === 'biweekly' ? '2 weeks' : 'month';
    
    return `Repeats ${daysText} every ${frequencyText}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                     <div className={styles.header}>
             <h2 className={styles.title}>
               {slot ? 'Edit availability' : 'New availability slot'}
             </h2>
            <button className={styles.closeButton} onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          <div className={styles.content}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Start time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={styles.timeInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>End time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={styles.timeInput}
              />
            </div>

            <div className={styles.recurrenceRow} onClick={() => setShowRepeatModal(true)}>
              <span className={styles.recurrenceText}>
                {getRecurrenceText()}
              </span>
              <span className={styles.arrow}>›</span>
            </div>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.saveButton} onClick={handleSave}>
              Save
            </button>
            {slot && onDelete && (
              <button className={styles.deleteButton} onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {showRepeatModal && (
        <RepeatAvailabilitySheet
          isOpen={showRepeatModal}
          onClose={() => setShowRepeatModal(false)}
          formData={formData}
          onSave={(data) => {
            setFormData(data);
            setShowRepeatModal(false);
          }}
        />
      )}
    </>
  );
};

interface RepeatAvailabilitySheetProps {
  isOpen: boolean;
  onClose: () => void;
  formData: AvailabilityFormData;
  onSave: (data: AvailabilityFormData) => void;
}

const RepeatAvailabilitySheet: React.FC<RepeatAvailabilitySheetProps> = ({
  isOpen,
  onClose,
  formData,
  onSave,
}) => {
  const [localData, setLocalData] = useState<AvailabilityFormData>(formData);

  // Update localData when formData changes (for editing)
  React.useEffect(() => {
    setLocalData(formData);
  }, [formData]);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);
  const [showEndsModal, setShowEndsModal] = useState(false);

  const dayNames = ['M', 'Tu', 'W', 'Th', 'F', 'Sa', 'Su'];
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

  const getFrequencyText = () => {
    switch (localData.frequency) {
      case 'never': return 'No repeat';
      case 'weekly': return 'Every 1 week';
      case 'biweekly': return 'Every 2 weeks';
      case 'monthly': return 'Every 1 month';
      default: return 'No repeat';
    }
  };

  const getEndsText = () => {
    switch (localData.ends) {
      case 'never': return 'Never';
      case 'on_date': return localData.endDate ? `Until ${new Date(localData.endDate).toLocaleDateString()}` : 'Select end date';
      case 'after_occurrences': return localData.occurrences ? `After ${localData.occurrences} times` : 'Select number of times';
      default: return 'Never';
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.repeatSheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.repeatHeader}>
          <h3>Repeat availability</h3>
        </div>

        <div className={styles.repeatContent}>
          {localData.frequency === 'never' ? (
            <div className={styles.singleDateSection}>
              <label className={styles.sectionLabel}>Date</label>
              <div className={styles.dateInput}>
                <input
                  type="date"
                  value={localData.endDate || ''}
                  onChange={(e) => setLocalData(prev => ({ ...prev, endDate: e.target.value }))}
                  className={styles.datePicker}
                />
              </div>
            </div>
          ) : (
            <>
              <div className={styles.startDateSection}>
                <label className={styles.sectionLabel}>Date</label>
                <div className={styles.dateInput}>
                  <input
                    type="date"
                    value={localData.startDate || new Date().toISOString().split('T')[0]}
                    onChange={(e) => setLocalData(prev => ({ ...prev, startDate: e.target.value }))}
                    className={styles.datePicker}
                  />
                </div>
              </div>
              
              <div className={styles.daysSection}>
                <label className={styles.sectionLabel}>Days</label>
                <div className={styles.daysGrid}>
                  {dayNames.map((day, index) => {
                    const fullDayName = fullDayNames[index];
                    const isSelected = localData.days.includes(fullDayName);
                    return (
                      <button
                        key={day}
                        className={`${styles.dayButton} ${isSelected ? styles.dayButtonSelected : ''}`}
                        onClick={() => handleDayToggle(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className={styles.frequencySection}>
            <label className={styles.sectionLabel}>Frequency</label>
            <div className={styles.frequencyInput} onClick={() => setShowFrequencyModal(true)}>
              {getFrequencyText()}
            </div>
          </div>

          <div className={styles.endsSection}>
            <label className={styles.sectionLabel}>Ends</label>
            <div className={styles.endsInput} onClick={() => setShowEndsModal(true)}>
              {getEndsText()}
            </div>
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

             {showFrequencyModal && (
         <OptionSelectionModal
           isOpen={showFrequencyModal}
           onClose={() => setShowFrequencyModal(false)}
           title="Select Frequency"
           options={[
             { label: 'No repeat', value: 'never' },
             { label: 'Every Week', value: 'weekly' },
             { label: 'Every Two Weeks', value: 'biweekly' },
             { label: 'Every Month', value: 'monthly' },
           ]}
           selectedValue={localData.frequency}
                       onSelect={(value) => {
              const newFrequency = value as any;
              setLocalData(prev => {
                // If changing to single occurrence, clear days and set endDate to today
                if (newFrequency === 'never') {
                  return {
                    ...prev,
                    frequency: newFrequency,
                    days: [],
                    endDate: new Date().toISOString().split('T')[0], // Today's date
                    startDate: undefined, // Clear startDate for single occurrences
                    ends: 'on_date'
                  };
                }
                // If changing from single occurrence to recurring, preserve the existing startDate or use today
                if (prev.frequency === 'never' && newFrequency !== 'never') {
                  return {
                    ...prev,
                    frequency: newFrequency,
                    startDate: prev.startDate || new Date().toISOString().split('T')[0], // Keep existing startDate or use today
                    endDate: undefined,
                    ends: 'never'
                  };
                }
                // If already recurring, preserve the existing startDate or use today
                if (newFrequency !== 'never' && !prev.startDate) {
                  return {
                    ...prev,
                    frequency: newFrequency,
                    startDate: prev.startDate || new Date().toISOString().split('T')[0] // Keep existing startDate or use today
                  };
                }
                return { ...prev, frequency: newFrequency };
              });
              setShowFrequencyModal(false);
            }}
         />
       )}

             {showEndsModal && (
         <EndsSelectionModal
           isOpen={showEndsModal}
           onClose={() => setShowEndsModal(false)}
           localData={localData}
           onUpdate={(updatedData) => {
             setLocalData(updatedData);
             setShowEndsModal(false);
           }}
         />
       )}
    </div>
  );
};

interface OptionSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

interface EndsSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  localData: AvailabilityFormData;
  onUpdate: (updatedData: AvailabilityFormData) => void;
}

const OptionSelectionModal: React.FC<OptionSelectionModalProps> = ({
  isOpen,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.optionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.optionHeader}>
          <h3>{title}</h3>
        </div>

        <div className={styles.optionContent}>
          {options.map((option) => (
            <button
              key={option.value}
              className={`${styles.optionButton} ${selectedValue === option.value ? styles.optionSelected : ''}`}
              onClick={() => onSelect(option.value)}
            >
              <div className={styles.radioButton}>
                {selectedValue === option.value && <div className={styles.radioSelected} />}
              </div>
              <span>{option.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.optionActions}>
          <button className={styles.confirmButton} onClick={onClose}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const EndsSelectionModal: React.FC<EndsSelectionModalProps> = ({
  isOpen,
  onClose,
  localData,
  onUpdate,
}) => {
  const [tempData, setTempData] = useState<AvailabilityFormData>(localData);

  // Update tempData when localData changes
  React.useEffect(() => {
    setTempData(localData);
  }, [localData]);

  const handleSave = () => {
    onUpdate(tempData);
  };

  const handleEndsChange = (ends: 'never' | 'on_date' | 'after_occurrences') => {
    setTempData(prev => ({ ...prev, ends }));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.optionModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.optionHeader}>
          <h3>When does this end?</h3>
        </div>

        <div className={styles.optionContent}>
          <button
            className={`${styles.optionButton} ${tempData.ends === 'never' ? styles.optionSelected : ''}`}
            onClick={() => handleEndsChange('never')}
          >
            <div className={styles.radioButton}>
              {tempData.ends === 'never' && <div className={styles.radioSelected} />}
            </div>
            <span>Never</span>
          </button>

          <button
            className={`${styles.optionButton} ${tempData.ends === 'on_date' ? styles.optionSelected : ''}`}
            onClick={() => handleEndsChange('on_date')}
          >
            <div className={styles.radioButton}>
              {tempData.ends === 'on_date' && <div className={styles.radioSelected} />}
            </div>
            <span>On a specific date</span>
          </button>

          {tempData.ends === 'on_date' && (
            <div className={styles.dateInputContainer}>
              <input
                type="date"
                value={tempData.endDate || ''}
                onChange={(e) => setTempData(prev => ({ ...prev, endDate: e.target.value }))}
                className={styles.dateInput}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}

          <button
            className={`${styles.optionButton} ${tempData.ends === 'after_occurrences' ? styles.optionSelected : ''}`}
            onClick={() => handleEndsChange('after_occurrences')}
          >
            <div className={styles.radioButton}>
              {tempData.ends === 'after_occurrences' && <div className={styles.radioSelected} />}
            </div>
            <span>After a number of times</span>
          </button>

          {tempData.ends === 'after_occurrences' && (
            <div className={styles.occurrencesInputContainer}>
              <input
                type="number"
                value={tempData.occurrences || ''}
                onChange={(e) => setTempData(prev => ({ ...prev, occurrences: parseInt(e.target.value) || 1 }))}
                className={styles.occurrencesInput}
                min="1"
                max="100"
                placeholder="Number of times"
              />
              <span className={styles.occurrencesLabel}>times</span>
            </div>
          )}
        </div>

        <div className={styles.optionActions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.confirmButton} onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAvailabilityModal;
