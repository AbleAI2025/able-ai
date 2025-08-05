import React, { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import styles from './TextAreaBubble.module.css';
import chatStyles from '../../styles/chat.module.css'; // Import global styles

interface TextAreaBubbleProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
  onKeyPress?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const TextAreaBubble = React.forwardRef<HTMLTextAreaElement, TextAreaBubbleProps>(
  ({
    id,
    name,
    placeholder,
    value,
    onChange,
    required = false,
    disabled = false,
    rows = 3,
    onFocus,
    onBlur,
    onKeyPress,
  }, ref) => {
    return (
      <div className={`${styles.textAreaBubbleWrapper} ${styles.alignUser}`}>
        <div className={styles.textAreaBubbleContent}>
          <textarea
            id={id || name}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            onKeyPress={onKeyPress}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${styles.textAreaField} ${chatStyles.inputField}`}
            ref={ref}
          />
        </div>
      </div>
    );
  }
);

TextAreaBubble.displayName = 'TextAreaBubble';
export default TextAreaBubble;