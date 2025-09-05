import { ValidationRules } from '../hooks/useFormValidation';

export const gigFormValidation: ValidationRules = {
  gigDescription: [
    {
      test: (value: string) => value.length >= 10,
      message: 'Description must be at least 10 characters long'
    },
    {
      test: (value: string) => value.length <= 500,
      message: 'Description must not exceed 500 characters'
    }
  ],
  hourlyRate: [
    {
      test: (value: number) => !isNaN(value) && value >= 12.21,
      message: 'Hourly rate must be at least £12.21 (London minimum wage)'
    },
    {
      test: (value: number) => !isNaN(value) && value <= 500,
      message: 'Hourly rate must not exceed £500'
    }
  ],
  gigLocation: [
    {
      test: (value: string) => value.length >= 5,
      message: 'Please enter a valid location'
    }
  ],
  gigDate: [
    {
      test: (value: string) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return !isNaN(date.getTime()) && date >= today;
      },
      message: 'Please select a future date'
    }
  ],
  additionalInstructions: [
    {
      test: (value: string) => value.length <= 1000,
      message: 'Additional instructions must not exceed 1000 characters'
    }
  ]
};
