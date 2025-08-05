"use client";

import React from 'react';
import styles from './InputBubble.module.css';

interface InputBubbleProps {
  id?: string;
  name: string;
  type: 'text' | 'number' | 'textarea' | 'email' | 'password' | 'date' | 'tel';
  label?: string;
  value: string | number;
  onChange: (value: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

const InputBubble: React.FC<InputBubbleProps> = ({
  id,
  name,
  type,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 3,
  onFocus,
  onBlur,
  onKeyPress
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
    if (typeof e === 'string') {
      onChange(e);
    } else {
      onChange(e.target.value);
    }
  };

  return (
    <div className={styles.inputBubbleWrapper}>
      {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
      <div className={styles.inputField}>
        {type === 'textarea' ? (
          <textarea
            id={id || name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            className={styles.textarea}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
          />
        ) : (
          <input
            type={type}
            id={id || name}
            name={name}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            className={styles.input}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
          />
        )}
      </div>
    </div>
  );
};

export default InputBubble;
