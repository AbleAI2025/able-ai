"use client";

import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { AvailabilitySlot, AvailabilityFormData } from "@/app/types/AvailabilityTypes";
import styles from "./AvailabilityEditModal.module.css";

interface AvailabilityEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot?: AvailabilitySlot | null;
  onSave: (data: AvailabilityFormData) => void;
  onDelete?: () => void;
  selectedDate?: Date;
}

const AvailabilityEditModal: React.FC<AvailabilityEditModalProps> = ({
  isOpen,
  onClose,
  slot,
  onSave,
  onDelete,
  selectedDate,
}) => {
  const [formData, setFormData] = useState<AvailabilityFormData>({
    startTime: "09:00",
    endTime: "17:00",
    days: [],
    frequency: "weekly",
    ends: "never",
  });

  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    if (slot) {
      setFormData({
        startTime: slot.startTime,
        endTime: slot.endTime,
        days: slot.days,
        frequency: slot.frequency,
        ends: slot.ends,
        endDate: slot.endDate,
        occurrences: slot.occurrences,
      });
    } else if (selectedDate) {
      // Set default day based on selected date
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayName = dayNames[selectedDate.getDay()];
      setFormData(prev => ({
        ...prev,
        days: [dayName],
      }));
    }
  }, [slot, selectedDate]);

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
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

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <h2 className={styles.title}>
              Edit availability - {slot ? `${getDayName(new Date())} ${getFormattedDate(new Date())}` : 'New Slot'}
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
                Repeats {formData.days.join('-')} every {formData.frequency === 'weekly' ? 'week' : formData.frequency === 'biweekly' ? '2 weeks' : 'month'}
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
            {slot && (
              <button className={styles.deleteButton} onClick={() => setShowClearModal(true)}>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Repeat Modal */}
      {showRepeatModal && (
        <RepeatAvailabilityModal
          isOpen={showRepeatModal}
          onClose={() => setShowRepeatModal(false)}
          formData={formData}
          onSave={(data) => {
            setFormData(data);
            setShowRepeatModal(false);
          }}
        />
      )}

      {/* Clear Confirmation Modal */}
      {showClearModal && (
        <ClearAvailabilityModal
          isOpen={showClearModal}
          onClose={() => setShowClearModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
};

// Repeat Availability Modal Component
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

          <div className={styles.frequencySection}>
            <label className={styles.sectionLabel}>Frequency</label>
            <div className={styles.frequencyInput}>
              Every {localData.frequency === 'weekly' ? '1 week' : localData.frequency === 'biweekly' ? '2 weeks' : '1 month'}
            </div>
          </div>

          <div className={styles.endsSection}>
            <label className={styles.sectionLabel}>Ends</label>
            <div className={styles.endsInput}>
              {localData.ends === 'never' ? 'Never' : localData.ends === 'on_date' ? 'On date' : 'After occurrences'}
            </div>
          </div>

          <div className={styles.summary}>
            Repeats {localData.days.join('-')} every {localData.frequency === 'weekly' ? 'week' : localData.frequency === 'biweekly' ? '2 weeks' : 'month'}
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

// Clear Availability Modal Component
interface ClearAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ClearAvailabilityModal: React.FC<ClearAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.clearModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.clearHeader}>
          <h3>Clear availability?</h3>
        </div>
        <div className={styles.clearContent}>
          <p>This action cannot be undone.</p>
        </div>
        <div className={styles.clearActions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.clearButton} onClick={onConfirm}>
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityEditModal;
