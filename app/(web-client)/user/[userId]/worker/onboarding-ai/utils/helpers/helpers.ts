import { isValidDate, isValidCoordinate } from '../validation/validation-utils';

export function formatDateForDisplay(dateValue: unknown): string {
  if (!dateValue) return "Not provided";
  try {
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue.toLocaleDateString();
    }
    return String(dateValue);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(dateValue);
  }
}

export function formatSummaryValue(value: unknown, field?: string): string {
  if (!value) return "Not provided";
  try {
    if (field === 'location' && isValidCoordinate(value)) {
      if (typeof value === 'object' && 'formatted_address' in value && (value as any).formatted_address) {
        return (value as any).formatted_address;
      }
      return `Lat: ${value.lat.toFixed(6)}, Lng: ${value.lng.toFixed(6)}`;
    }
    if (field === 'availability') {
      if (typeof value === 'object' && value !== null && 'days' in value) {
        const availability = value as { days: string[]; startTime: string; endTime: string };
        const weekDays = [
          { value: 'monday', label: 'Monday' },
          { value: 'tuesday', label: 'Tuesday' },
          { value: 'wednesday', label: 'Wednesday' },
          { value: 'thursday', label: 'Thursday' },
          { value: 'friday', label: 'Friday' },
          { value: 'saturday', label: 'Saturday' },
          { value: 'sunday', label: 'Sunday' }
        ];
        const days = availability.days.map((day: string) => weekDays.find(d => d.value === day)?.label).join(', ');
        return `${days} ${availability.startTime} - ${availability.endTime}`;
      }
      return formatDateForDisplay(value);
    }
    if (field === 'hourlyRate') {
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      return isNaN(numValue as number) ? String(value) : `£${numValue}`;
    }
    if (field === 'experience') {
      if (typeof value === 'string' && value.startsWith('{')) {
        try {
          const expData = JSON.parse(value);
          if (expData.years !== undefined) {
            let display = '';
            if (expData.years > 0) {
              display = `${expData.years} year${expData.years !== 1 ? 's' : ''}`;
            }
            if (expData.months > 0) {
              if (display) display += ' and ';
              display += `${expData.months} month${expData.months !== 1 ? 's' : ''}`;
            }
            if (!display) {
              display = 'Less than 1 year';
            }
            return display;
          }
        } catch (e) {
        }
      }
      return String(value);
    }
    if (field === 'equipment') {
      if (typeof value === 'string') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map((item: any) => item.name || item).join(', ');
      }
      return String(value);
    }
    if (field === 'videoIntro' && typeof value === 'string' && value.startsWith('http')) {
      return "Video uploaded ✓";
    }
    return String(value);
  } catch (error) {
    console.error('Summary value formatting error:', error);
    return String(value);
  }
}

export function buildRecommendationLink(workerProfileId: string | null): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  
  if (!workerProfileId) {
    throw new Error('Worker profile ID is required to build recommendation link');
  }
  
  // Use the worker profile ID (UUID) for the recommendation URL
  return `${origin}/worker/${workerProfileId}/recommendation`;
}


