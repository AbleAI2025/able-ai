/**
 * Utility functions for parsing and processing experience-related data
 */

export interface ExperienceData {
  years: number;
  months: number;
}

/**
 * Parse experience text to extract years and months as numeric values
 * Supports various formats like "25 years", "2.5 years", "25 years 3 months", etc.
 * 
 * @param experienceText - The experience text to parse
 * @returns Object containing years and months as numbers
 */
export const parseExperienceToNumeric = (experienceText: string): ExperienceData => {
  if (!experienceText || experienceText.trim().length === 0) {
    return { years: 0, months: 0 };
  }

  const text = experienceText.toLowerCase();
  let years = 0;
  let months = 0;

  // Pattern 0: Simple number only (e.g., "5", "2.5") - most lenient
  const simpleNumberMatch = text.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
  if (simpleNumberMatch) {
    const num = parseFloat(simpleNumberMatch[1]);
    years = Math.floor(num);
    months = Math.round((num - years) * 12);
    return { years, months };
  }

  // Pattern 1: "25 years" or "25 yrs" or "25y"
  const yearsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y)\b/);
  if (yearsMatch) {
    years = parseFloat(yearsMatch[1]);
  }

  // Pattern 2: "25 years and 3 months" or "25 years 3 months" or "25y 3m"
  const yearsAndMonthsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:years?|yrs?|y).*?(\d+)\s*(?:months?|mon|m)\b/);
  if (yearsAndMonthsMatch) {
    years = parseFloat(yearsAndMonthsMatch[1]);
    months = parseInt(yearsAndMonthsMatch[2]);
  }

  // Pattern 3: "3 months" only (no years mentioned)
  const monthsOnlyMatch = text.match(/(\d+)\s*(?:months?|mon|m)\b/);
  if (monthsOnlyMatch && years === 0) {
    months = parseInt(monthsOnlyMatch[1]);
    // Convert months to years if more than 12 months
    if (months >= 12) {
      years = Math.floor(months / 12);
      months = months % 12;
    }
  }

  // Pattern 4: "2.5 years" (decimal years)
  const decimalYearsMatch = text.match(/(\d+\.\d+)\s*(?:years?|yrs?|y)\b/);
  if (decimalYearsMatch && years === 0) {
    const decimalYears = parseFloat(decimalYearsMatch[1]);
    years = Math.floor(decimalYears);
    months = Math.round((decimalYears - years) * 12);
  }

  return { years, months };
};

/**
 * Convert years and months to total years as a decimal
 * 
 * @param years - Number of years
 * @param months - Number of months
 * @returns Total years as a decimal number
 */
export const convertToTotalYears = (years: number, months: number): number => {
  return years + (months / 12);
};

/**
 * Format experience data as a human-readable string
 * 
 * @param years - Number of years
 * @param months - Number of months
 * @returns Formatted experience string
 */
export const formatExperienceString = (years: number, months: number): string => {
  if (years === 0 && months === 0) {
    return 'No experience';
  }
  
  if (years === 0) {
    return months === 1 ? '1 month' : `${months} months`;
  }
  
  if (months === 0) {
    return years === 1 ? '1 year' : `${years} years`;
  }
  
  return `${years} year${years !== 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}`;
};
