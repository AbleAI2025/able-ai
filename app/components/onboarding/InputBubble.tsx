import React, { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import styles from './InputBubble.module.css';
import chatStyles from '../../styles/chat.module.css'; // Import global styles

interface InputBubbleProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'number' | 'password' | 'tel' | 'date' | 'time'; // Added 'date' and 'time' for consistency
  placeholder?: string;
  value?: string | number;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: KeyboardEvent<HTMLInputElement>) => void;
  isNew?: boolean; // Track if this input is new for animation
}

const InputBubble = React.forwardRef<HTMLInputElement, InputBubbleProps>(
  ({
    id,
    name,
    type = 'text',
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    onFocus,
    onBlur,
    onKeyPress,
    isNew = false,
  }, ref) => {
    const animationClass = isNew ? styles.inputBubbleWrapperNew : '';
    return (
      <div className={`${styles.inputBubbleWrapper} ${styles.alignUser} ${animationClass}`}>
        <div className={styles.inputBubbleContent}>
          <input
            id={id || name}
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
            required={required}
            disabled={disabled}
            className={`${styles.inputField} ${chatStyles.inputField}`}
            ref={ref}
          />
        </div>
      </div>
    );
  }
);

InputBubble.displayName = 'InputBubble';
export default InputBubble;