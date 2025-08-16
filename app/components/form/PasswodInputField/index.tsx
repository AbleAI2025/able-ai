import React from 'react'
import InputField from '../InputField';
import styles from './PasswordInputField.module.css';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputFieldProps {
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>> | ((value: string) => void);
  id: string;
  name: string;
  placeholder: string;
  required: boolean;
}

const PasswordInputField = ({ password, setPassword, id, name, placeholder, required }: PasswordInputFieldProps) => {
    const [show, setShow] = React.useState(false);

  return (
    <div className={styles.passwordContainer}>
        <InputField
            type={show ? "text" : "password"}
            id={id}
            name={name}
            placeholder={placeholder}
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
            }
            required={required}
        />
        <button
            type="button"
            className={styles.togglePasswordVisibility}
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            >
            {show ? <Eye className={styles.eyeIcon} /> : <EyeOff className={styles.eyeIcon} />}
        </button>
    </div>
  )
}

export default PasswordInputField;
