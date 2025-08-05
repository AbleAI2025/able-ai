"use client";

import React, { useState } from 'react';
import styles from './LocationPickerBubble.module.css';

interface LocationPickerBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm?: () => Promise<void>;
  disabled?: boolean;
  showConfirm?: boolean;
}

const LocationPickerBubble: React.FC<LocationPickerBubbleProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  disabled
}) => {
  const [address, setAddress] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleSubmit = () => {
    if (!disabled) {
      onChange(address);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className={styles.locationBubbleWrapper}>
      {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
      <div className={styles.locationInputContainer}>
        {isEditing ? (
          <div className={styles.inputWrapper}>
            <input
              type="text"
              id={id || name}
              value={address}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className={styles.locationInput}
              placeholder="Enter address or paste Google Maps link"
              disabled={disabled}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              className={styles.confirmButton}
              disabled={disabled}
            >
              Confirm
            </button>
          </div>
        ) : (
          <div 
            className={styles.displayAddress} 
            onClick={() => !disabled && setIsEditing(true)}
          >
            {address || "Click to set location"}
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationPickerBubble;
