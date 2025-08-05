import { useState, useCallback } from 'react';

export type ValidationRule<T = any> = {
  test: (value: T) => boolean;
  message: string;
};

export type ValidationRules = {
  [key: string]: ValidationRule[];
};

export interface ValidationState {
  [key: string]: {
    isValid: boolean;
    errors: string[];
  };
}

export function useFormValidation(rules: ValidationRules) {
  const [validationState, setValidationState] = useState<ValidationState>({});

  const validateField = useCallback((fieldName: string, value: any) => {
    if (!rules[fieldName]) {
      return true;
    }

    const fieldRules = rules[fieldName];
    const errors: string[] = [];

    fieldRules.forEach(rule => {
      if (!rule.test(value)) {
        errors.push(rule.message);
      }
    });

    setValidationState(prev => ({
      ...prev,
      [fieldName]: {
        isValid: errors.length === 0,
        errors
      }
    }));

    return errors.length === 0;
  }, [rules]);

  const validateForm = useCallback((formData: Record<string, any>) => {
    const validations = Object.keys(rules).map(fieldName => ({
      fieldName,
      isValid: validateField(fieldName, formData[fieldName])
    }));

    const isValid = validations.every(v => v.isValid);
    return isValid;
  }, [rules, validateField]);

  const clearValidation = useCallback((fieldName?: string) => {
    if (fieldName) {
      setValidationState(prev => {
        const newState = { ...prev };
        delete newState[fieldName];
        return newState;
      });
    } else {
      setValidationState({});
    }
  }, []);

  return {
    validateField,
    validateForm,
    clearValidation,
    validationState
  };
}
