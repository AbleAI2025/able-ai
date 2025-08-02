"use client";

import React, { forwardRef } from 'react';
import DatePicker from 'react-datepicker';
import styles from './CalendarPickerBubble.module.css';
import "react-datepicker/dist/react-datepicker.css";

interface CalendarPickerBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  disabled?: boolean;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
}

const CustomInput = forwardRef<HTMLButtonElement, CustomInputProps>(({ value, onClick }, ref) => (
  <button 
    className={styles.datePickerCustomInput} 
    onClick={onClick} 
    ref={ref}
  >
    {value || "Click to select date"}
  </button>
));

CustomInput.displayName = 'CustomInput';

const CalendarPickerBubble: React.FC<CalendarPickerBubbleProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  disabled
}) => {
  return (
    <div className={styles.calendarBubbleWrapper}>
      {label && <label htmlFor={id || name} className={styles.label}>{label}</label>}
      <div className={styles.calendarBubbleContent}>
        <DatePicker
          selected={value}
          onChange={onChange}
          customInput={<CustomInput />}
          dateFormat="MMMM d, yyyy"
          disabled={disabled}
          minDate={new Date()}
          placeholderText="Select date"
          className={styles.datePicker}
        />
      </div>
    </div>
  );
};

export default CalendarPickerBubble;
