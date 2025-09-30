/**
 * setAvailability.ts
 * 
 * Modularized function for setting and validating availability schedule.
 * Provides comprehensive validation and structured data formatting
 * for availability information.
 */

export type Availability = {
  days: string[];
  startTime: string;
  endTime: string;
  frequency?: 'never' | 'weekly' | 'biweekly' | 'monthly';
  ends?: 'never' | 'on_date' | 'after_occurrences';
  endDate?: string;
  occurrences?: number;
};

/**
 * Set and validate availability schedule
 * Captures user's available days/hours and migrates current calendar functionality
 */
export function setAvailability(value: Partial<Availability> | undefined): { 
  ok: boolean; 
  error?: string; 
  availability?: Availability;
  isAppropriate?: boolean;
  isWorkerRelated?: boolean;
} {
  const defaults: Availability = {
    days: [],
    startTime: '09:00',
    endTime: '17:00',
    frequency: 'weekly',
    ends: 'never',
    endDate: undefined,
    occurrences: undefined,
  };
  
  const merged: Availability = { ...defaults, ...(value || {}) };
  
  // Validate days
  if (!merged.days || merged.days.length === 0) {
    return { 
      ok: false, 
      error: 'Please select at least one day of availability',
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate day names
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const invalidDays = merged.days.filter(day => !validDays.includes(day.toLowerCase()));
  
  if (invalidDays.length > 0) {
    return { 
      ok: false, 
      error: `Invalid day names: ${invalidDays.join(', ')}. Please use standard day names.`,
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate time format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(merged.startTime) || !timeRegex.test(merged.endTime)) {
    return { 
      ok: false, 
      error: 'Please provide valid time format (HH:MM)',
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate time range
  const startTimeMinutes = parseInt(merged.startTime.split(':')[0]) * 60 + parseInt(merged.startTime.split(':')[1]);
  const endTimeMinutes = parseInt(merged.endTime.split(':')[0]) * 60 + parseInt(merged.endTime.split(':')[1]);
  
  if (startTimeMinutes >= endTimeMinutes) {
    return { 
      ok: false, 
      error: 'End time must be after start time',
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate frequency
  const validFrequencies = ['never', 'weekly', 'biweekly', 'monthly'];
  if (merged.frequency && !validFrequencies.includes(merged.frequency)) {
    return { 
      ok: false, 
      error: `Invalid frequency: ${merged.frequency}. Please use: ${validFrequencies.join(', ')}`,
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate end conditions
  const validEnds = ['never', 'on_date', 'after_occurrences'];
  if (merged.ends && !validEnds.includes(merged.ends)) {
    return { 
      ok: false, 
      error: `Invalid end condition: ${merged.ends}. Please use: ${validEnds.join(', ')}`,
      isAppropriate: true,
      isWorkerRelated: true
    };
  }
  
  // Validate end date if provided
  if (merged.ends === 'on_date' && merged.endDate) {
    const endDate = new Date(merged.endDate);
    if (isNaN(endDate.getTime())) {
      return { 
        ok: false, 
        error: 'Invalid end date format',
        isAppropriate: true,
        isWorkerRelated: true
      };
    }
    
    if (endDate <= new Date()) {
      return { 
        ok: false, 
        error: 'End date must be in the future',
        isAppropriate: true,
        isWorkerRelated: true
      };
    }
  }
  
  // Validate occurrences if provided
  if (merged.ends === 'after_occurrences' && merged.occurrences) {
    if (merged.occurrences < 1 || merged.occurrences > 1000) {
      return { 
        ok: false, 
        error: 'Occurrences must be between 1 and 1000',
        isAppropriate: true,
        isWorkerRelated: true
      };
    }
  }
  
  return { 
    ok: true, 
    availability: merged,
    isAppropriate: true,
    isWorkerRelated: true
  };
}

