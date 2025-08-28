/**
 * Comprehensive time validation and parsing utilities
 * Handles various time formats and prevents invalid time values
 */

export interface TimeRange {
  startTime: string;
  endTime: string;
  duration: number; // in hours
  isValid: boolean;
  error?: string;
}

export interface TimeValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
  parsedTime?: TimeRange;
}

/**
 * Simple test to verify time validation works
 */
export function runTimeValidationTests(): void {
  console.log('🧪 Running time validation tests...');
  
  const testCases = [
    '9:00 to 17:00',
    '09:00 to 17:00', 
    '9 to 17',
    '14:30',
    '9',
    '17',
    '09',
    '9am to 5pm',
    '2:30pm to 6:30pm',
    'invalid',
    '',
    '   '
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    const result = validateTimeInput(testCase);
    if (result.isValid) {
      console.log(`✅ PASS: "${testCase}" → "${result.sanitizedValue}"`);
    } else {
      console.log(`❌ FAIL: "${testCase}" → ${result.error}`);
    }
  });
  
  console.log('\n🧪 Time validation tests completed!');
}

/**
 * Comprehensive test function to verify time validation works correctly
 */
export function testTimeValidation(): void {
  console.log('=== TESTING TIME VALIDATION ===');
  
  const testCases = [
    // Valid time ranges
    '9:00-17:00',
    '09:00-17:00',
    '9am-5pm',
    '9:00am-5:00pm',
    '9 to 5',
    '9:00 to 17:00',
    '09:00 to 17:00',
    '9am to 5pm',
    '9:00am to 5:00pm',
    '2:30pm to 6:30pm',
    '14:30 to 18:30',
    
    // Valid single times
    '9:00',
    '09:00',
    '2:30pm',
    '14:30',
    '9',
    '17',
    '09',
    
    // Invalid formats
    'invalid',
    '25:00',
    '9:60',
    '9am to 25pm',
    '',
    '   ',
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\nTest ${index + 1}: "${testCase}"`);
    debugTimeValidation(testCase);
  });
  
  console.log('=== END TESTING ===');
}

/**
 * Test function to debug time validation issues
 */
export function debugTimeValidation(input: any): void {
  console.log('=== TIME VALIDATION DEBUG ===');
  console.log('Input:', input);
  console.log('Type:', typeof input);
  console.log('Stringified:', String(input));
  
  const result = validateTimeInput(input);
  console.log('Validation result:', result);
  
  if (!result.isValid) {
    console.log('Validation failed with error:', result.error);
  } else {
    console.log('Validation successful, sanitized value:', result.sanitizedValue);
  }
  console.log('=== END DEBUG ===');
}

/**
 * Validates if a string represents a valid time in 24-hour format
 */
export function isValidTime(timeStr: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeStr);
}

/**
 * Converts 12-hour format to 24-hour format
 */
export function convert12To24Hour(timeStr: string): string {
  const timeRegex = /^(\d{1,2}):?(\d{2})?\s*(am|pm)$/i;
  const match = timeStr.match(timeRegex);
  
  if (!match) return timeStr;
  
  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3].toLowerCase();
  
  if (period === 'pm' && hours !== 12) {
    hours += 12;
  } else if (period === 'am' && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Parses a time range string into structured data
 */
export function parseTimeRange(timeStr: string): TimeRange {
  const trimmedTime = timeStr.trim();
  
  console.log('parseTimeRange input:', trimmedTime);
  
  // Handle various time range formats
  const rangePatterns = [
    // "9:00-17:00" or "09:00-17:00"
    /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/,
    // "9am-5pm" or "9:00am-5:00pm"
    /^(\d{1,2}):?(\d{2})?\s*(am|pm)-(\d{1,2}):?(\d{2})?\s*(am|pm)$/i,
    // "9 to 5" or "9:00 to 17:00" or "09:00 to 17:00" (flexible format)
    /^(\d{1,2}):?(\d{2})?\s*to\s*(\d{1,2}):?(\d{2})?$/i,
    // "9am to 5pm"
    /^(\d{1,2}):?(\d{2})?\s*(am|pm)\s*to\s*(\d{1,2}):?(\d{2})?\s*(am|pm)$/i,
    // Additional patterns for AI-generated formats
    // "09:00 to 17:00" (with leading zeros)
    /^(\d{2}):(\d{2})\s*to\s*(\d{2}):(\d{2})$/,
    // "9:00 to 5:00" (mixed format)
    /^(\d{1,2}):(\d{2})\s*to\s*(\d{1,2}):(\d{2})$/,
    // "9 to 17" (no minutes)
    /^(\d{1,2})\s*to\s*(\d{1,2})$/,
    // "09 to 17" (with leading zeros, no minutes)
    /^(\d{2})\s*to\s*(\d{2})$/,
  ];
  
  for (let i = 0; i < rangePatterns.length; i++) {
    const pattern = rangePatterns[i];
    const match = trimmedTime.match(pattern);
    if (match) {
      console.log(`Pattern ${i} matched:`, { pattern: pattern.source, match });
      try {
        let startTime: string;
        let endTime: string;
        
        if (pattern.source.includes('am|pm')) {
          // Handle 12-hour format
          const startPart = `${match[1]}:${match[2] || '00'}${match[3]}`;
          const endPart = `${match[4]}:${match[5] || '00'}${match[6]}`;
          startTime = convert12To24Hour(startPart);
          endTime = convert12To24Hour(endPart);
          console.log('12-hour format conversion:', { startPart, endPart, startTime, endTime });
        } else if (pattern.source.includes('to')) {
          // Handle "9 to 5" or "9:00 to 17:00" or "09:00 to 17:00" format
          const startHour = match[1];
          const startMinute = match[2] || '00';
          const endHour = match[3];
          const endMinute = match[4] || '00';
          
          startTime = `${startHour.padStart(2, '0')}:${startMinute}`;
          endTime = `${endHour.padStart(2, '0')}:${endMinute}`;
          console.log('"to" format conversion:', { startHour, startMinute, endHour, endMinute, startTime, endTime });
        } else {
          // Handle 24-hour format with dash separator
          startTime = `${match[1].padStart(2, '0')}:${match[2]}`;
          endTime = `${match[3].padStart(2, '0')}:${match[4]}`;
          console.log('24-hour dash format conversion:', { startTime, endTime });
        }
        
        // Validate times
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          console.log('Time validation failed:', { startTime, endTime, isValidStart: isValidTime(startTime), isValidEnd: isValidTime(endTime) });
          return {
            startTime: '',
            endTime: '',
            duration: 0,
            isValid: false,
            error: 'Invalid time format'
          };
        }
        
        // Calculate duration
        const startHours = parseInt(startTime.split(':')[0], 10);
        const startMinutes = parseInt(startTime.split(':')[1], 10);
        const endHours = parseInt(endTime.split(':')[0], 10);
        const endMinutes = parseInt(endTime.split(':')[1], 10);
        
        let duration = (endHours - startHours) + (endMinutes - startMinutes) / 60;
        
        // Handle overnight shifts
        if (duration < 0) {
          duration += 24;
        }
        
        // Validate duration (reasonable work hours)
        if (duration <= 0 || duration > 24) {
          console.log('Duration validation failed:', { duration, startTime, endTime });
          return {
            startTime: '',
            endTime: '',
            duration: 0,
            isValid: false,
            error: 'Invalid duration (must be between 0 and 24 hours)'
          };
        }
        
        console.log('Time range parsed successfully:', { startTime, endTime, duration });
        return {
          startTime,
          endTime,
          duration,
          isValid: true
        };
      } catch (error) {
        console.error('Error parsing time range:', error);
        return {
          startTime: '',
          endTime: '',
          duration: 0,
          isValid: false,
          error: 'Failed to parse time range'
        };
      }
    }
  }
  
  console.log('No range pattern matched, trying single time patterns');
  
  // Handle single time format
  const singleTimePatterns = [
    /^(\d{1,2}):(\d{2})$/,
    /^(\d{1,2}):?(\d{2})?\s*(am|pm)$/i,
    // Additional patterns for AI-generated formats
    /^(\d{2}):(\d{2})$/, // "09:00" format
    /^(\d{1,2})$/, // "9" or "17" format
    /^(\d{2})$/, // "09" or "17" format with leading zero
  ];
  
  for (let i = 0; i < singleTimePatterns.length; i++) {
    const pattern = singleTimePatterns[i];
    const match = trimmedTime.match(pattern);
    if (match) {
      console.log(`Single time pattern ${i} matched:`, { pattern: pattern.source, match });
      try {
        let time: string;
        
        if (pattern.source.includes('am|pm')) {
          const timePart = `${match[1]}:${match[2] || '00'}${match[3]}`;
          time = convert12To24Hour(timePart);
          console.log('Single 12-hour format conversion:', { timePart, time });
        } else {
          // Handle various 24-hour formats
          if (match[2]) {
            // Has minutes: "9:00" or "09:00"
            time = `${match[1].padStart(2, '0')}:${match[2]}`;
          } else {
            // No minutes: "9" or "09" - assume it's hours
            time = `${match[1].padStart(2, '0')}:00`;
          }
          console.log('Single 24-hour format conversion:', { time });
        }
        
        if (!isValidTime(time)) {
          console.log('Single time validation failed:', { time, isValid: isValidTime(time) });
          return {
            startTime: '',
            endTime: '',
            duration: 0,
            isValid: false,
            error: 'Invalid time format'
          };
        }
        
        console.log('Single time parsed successfully:', { time });
        return {
          startTime: time,
          endTime: time,
          duration: 0,
          isValid: true
        };
      } catch (error) {
        console.error('Error parsing single time:', error);
        return {
          startTime: '',
          endTime: '',
          duration: 0,
          isValid: false,
          error: 'Failed to parse time'
        };
      }
    }
  }
  
  console.log('No patterns matched, returning unrecognized format error');
  return {
    startTime: '',
    endTime: '',
    duration: 0,
    isValid: false,
    error: 'Unrecognized time format'
  };
}

/**
 * Validates and sanitizes time input
 */
export function validateTimeInput(timeValue: any): TimeValidationResult {
  // Handle null/undefined
  if (!timeValue) {
    return {
      isValid: false,
      error: 'Time is required'
    };
  }
  
  // Convert to string if needed
  const timeStr = typeof timeValue === 'string' ? timeValue : String(timeValue);
  
  // Check if it's empty or just whitespace
  if (!timeStr.trim()) {
    return {
      isValid: false,
      error: 'Time cannot be empty'
    };
  }
  
  console.log('validateTimeInput processing:', {
    originalValue: timeValue,
    type: typeof timeValue,
    stringValue: timeStr,
    trimmed: timeStr.trim()
  });
  
  // Parse the time range
  const parsedTime = parseTimeRange(timeStr);
  
  console.log('parseTimeRange result:', parsedTime);
  
  if (!parsedTime.isValid) {
    return {
      isValid: false,
      error: parsedTime.error || 'Invalid time format'
    };
  }
  
  // Create sanitized value
  let sanitizedValue: string;
  if (parsedTime.startTime === parsedTime.endTime) {
    // Single time
    sanitizedValue = parsedTime.startTime;
  } else {
    // Time range
    sanitizedValue = `${parsedTime.startTime} to ${parsedTime.endTime}`;
  }
  
  console.log('validateTimeInput success:', {
    sanitizedValue,
    parsedTime
  });
  
  return {
    isValid: true,
    sanitizedValue,
    parsedTime
  };
}

/**
 * Formats time for display
 */
export function formatTimeForDisplay(timeValue: any): string {
  if (!timeValue) return 'Time not specified';
  
  console.log('formatTimeForDisplay input:', { timeValue, type: typeof timeValue });
  
  const validation = validateTimeInput(timeValue);
  
  console.log('formatTimeForDisplay validation result:', validation);
  
  if (!validation.isValid) {
    return 'Invalid time format';
  }
  
  return validation.sanitizedValue || String(timeValue);
}

/**
 * Creates ISO time strings for database storage
 */
export function createTimeISOStrings(dateStr: string, timeRange: TimeRange): {
  startTimeISO: string;
  endTimeISO: string;
} {
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date');
  }
  
  const [startHour, startMinute] = timeRange.startTime.split(':').map(Number);
  const [endHour, endMinute] = timeRange.endTime.split(':').map(Number);
  
  const startTime = new Date(date);
  startTime.setHours(startHour, startMinute, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(endHour, endMinute, 0, 0);
  
  // Handle overnight shifts
  if (endTime <= startTime) {
    endTime.setDate(endTime.getDate() + 1);
  }
  
  return {
    startTimeISO: startTime.toISOString(),
    endTimeISO: endTime.toISOString()
  };
}

/**
 * Validates if a time is within business hours (optional)
 */
export function isWithinBusinessHours(timeRange: TimeRange): boolean {
  const [startHour] = timeRange.startTime.split(':').map(Number);
  const [endHour] = timeRange.endTime.split(':').map(Number);
  
  // Consider 6 AM to 2 AM as reasonable business hours
  const isStartReasonable = startHour >= 6 || startHour <= 2;
  const isEndReasonable = endHour >= 6 || endHour <= 2;
  
  return isStartReasonable && isEndReasonable;
}

/**
 * Provides helpful error messages for common time input mistakes
 */
export function getTimeInputHelp(): string {
  return `Please enter time in one of these formats:
• Single time: "9:00", "2:30pm", "14:30"
• Time range: "9:00-17:00", "9am to 5pm", "14:30 to 18:30"
• Examples: "9am-5pm", "10:00 to 16:00", "2:30pm to 6:30pm"`;
}
