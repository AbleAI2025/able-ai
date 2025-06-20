import React, { FocusEvent } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './CalendarPickerBubble.module.css';
import { CalendarDays } from 'lucide-react';

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void; // Added for completeness, though not used by default DatePicker custom input
  placeholderText?: string;
}

const CustomInput = React.forwardRef<HTMLButtonElement, CustomInputProps>(
  ({ value: dateValue, onClick, placeholderText }, inputRef) => (
    <button type="button" className={styles.datePickerCustomInput} onClick={onClick} ref={inputRef}>
      <CalendarDays size={16} className={styles.calendarIcon} />
      {dateValue || <span className={styles.placeholderText}>{placeholderText}</span>}
    </button>
  )
);
CustomInput.displayName = 'CustomInput';

interface CalendarPickerBubbleProps {
  id?: string;
  name?: string;
  label?: string;
  value?: Date | null | undefined; // DatePicker selected value is Date or null
  onChange: (date: Date | null) => void; // DatePicker onChange provides Date or null
  disabled?: boolean;
  placeholderText?: string;
  dateFormat?: string | string[];
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void; // Datepicker input is an HTMLInputElement
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  popperPlacement?: DatePickerProps['popperPlacement'];
}

const CalendarPickerBubble = React.forwardRef<DatePicker, CalendarPickerBubbleProps>( // Ref type is DatePicker
  ({
    id,
    name,
    label,
    value,
    onChange,
    disabled,
    placeholderText = "Select a date",
    dateFormat = "MMMM d, yyyy",
    onBlur,
    onFocus,
    popperPlacement = "top-end"
  }, ref) => {
    const inputId = id || name;

    return (
      <div className={`${styles.calendarBubbleWrapper} ${styles.alignUser}`}>
        <div className={styles.calendarBubbleContent}>
          {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
          <DatePicker
            inline
            id={inputId}
            name={name}
            selected={value}
            onChange={onChange}
            disabled={disabled}
            dateFormat={dateFormat}
            placeholderText={placeholderText} // Note: placeholderText on DatePicker itself, not CustomInput for this setup
            customInput={<CustomInput placeholderText={placeholderText} />}
            popperPlacement={popperPlacement}
            onBlur={onBlur}
            onFocus={onFocus}
            ref={ref}
            autoComplete="off" // Prevent browser autocomplete on date input
          />
        </div>
      </div>
    );
  }
);

CalendarPickerBubble.displayName = 'CalendarPickerBubble';
export default CalendarPickerBubble;