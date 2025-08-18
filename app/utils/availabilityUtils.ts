import { AvailabilitySlot, AvailabilityEvent } from "@/app/types/AvailabilityTypes";

export function convertAvailabilitySlotsToEvents(slots: AvailabilitySlot[], startDate: Date, endDate: Date): AvailabilityEvent[] {
  const events: AvailabilityEvent[] = [];
  
  slots.forEach(slot => {
    const slotEvents = generateEventsFromSlot(slot, startDate, endDate);
    events.push(...slotEvents);
  });
  
  return events;
}

/**
 * Simple conflict detection - only checks if slots overlap in time on the same days
 */
export function doSlotsOverlap(slot1: AvailabilitySlot, slot2: AvailabilitySlot): boolean {
  // Check time overlap first
  const start1 = slot1.startTime;
  const end1 = slot1.endTime;
  const start2 = slot2.startTime;
  const end2 = slot2.endTime;
  
  const timeOverlap = start1 < end2 && start2 < end1;
  if (!timeOverlap) {
    return false; // No time overlap, no conflict
  }
  
  // For single occurrences, check if they're on the same date
  if (slot1.frequency === 'never' && slot2.frequency === 'never') {
    const date1 = slot1.endDate;
    const date2 = slot2.endDate;
    return date1 === date2;
  }
  
  // For recurring slots, check if they share any days
  if (slot1.frequency !== 'never' && slot2.frequency !== 'never') {
    const commonDays = slot1.days.filter(day => slot2.days.includes(day));
    return commonDays.length > 0;
  }
  
  // For mixed types (single vs recurring), check if single date falls on recurring days
  const singleSlot = slot1.frequency === 'never' ? slot1 : slot2;
  const recurringSlot = slot1.frequency === 'never' ? slot2 : slot1;
  
  if (singleSlot.endDate) {
    const singleDate = new Date(singleSlot.endDate);
    const dayName = getDayName(singleDate);
    const normalizedDayName = normalizeDayName(dayName);
    return recurringSlot.days.includes(normalizedDayName);
  }
  
  return false;
}

function generateEventsFromSlot(slot: AvailabilitySlot, startDate: Date, endDate: Date): AvailabilityEvent[] {
  const events: AvailabilityEvent[] = [];
  
  // Start from today if the provided start date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveStartDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  
  // Handle single occurrence
  if (slot.frequency === 'never') {
    if (slot.endDate) {
      const eventDate = new Date(slot.endDate);
      if (eventDate >= effectiveStartDate && eventDate <= endDate) {
        const event = createEventFromSlot(slot, eventDate);
        if (event) {
          events.push(event);
        }
      }
    }
    return events;
  }
  
  // Handle recurring patterns
  let currentDate = new Date(effectiveStartDate);
  let occurrenceCount = 0;
  
  // For recurring patterns, we need to check each day individually
  // to properly handle end dates and frequency patterns
  while (currentDate <= endDate) {
    const dayName = getDayName(currentDate);
    const normalizedDayName = normalizeDayName(dayName);
    
    if (slot.days.includes(normalizedDayName)) {
      // Check end conditions
      if (shouldCreateEventForDate(slot, currentDate, occurrenceCount)) {
        const event = createEventFromSlot(slot, currentDate);
        if (event) {
          events.push(event);
          occurrenceCount++;
          
          // Check if we've reached the maximum occurrences
          if (slot.ends === 'after_occurrences' && slot.occurrences && occurrenceCount >= slot.occurrences) {
            break;
          }
        }
      }
    }
    
    // Always advance by one day for proper day-by-day checking
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return events;
}

function createEventFromSlot(slot: AvailabilitySlot, date: Date): AvailabilityEvent | null {
  const eventStart = new Date(date);
  const eventEnd = new Date(date);
  
  // Set start time
  const [startHour, startMinute] = slot.startTime.split(':').map(Number);
  eventStart.setHours(startHour, startMinute, 0, 0);
  
  // Set end time
  const [endHour, endMinute] = slot.endTime.split(':').map(Number);
  eventEnd.setHours(endHour, endMinute, 0, 0);
  
  return {
    id: `${slot.id}-${date.toISOString().split('T')[0]}`,
    title: 'Available',
    start: eventStart,
    end: eventEnd,
    allDay: false,
    status: 'AVAILABLE',
    eventType: 'availability',
    isRecurring: slot.frequency !== 'never',
    recurrenceRule: generateRecurrenceRule(slot),
    originalSlotId: slot.id,
  };
}

function shouldCreateEventForDate(slot: AvailabilitySlot, date: Date, occurrenceCount: number = 0): boolean {
  // Don't create events for dates that have already passed
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0);
  
  if (eventDate < today) {
    return false;
  }
  
  // Handle single occurrence
  if (slot.frequency === 'never') {
    return true;
  }
  
  // Check end conditions
  if (slot.ends === 'never') {
    return true;
  }
  
  if (slot.ends === 'on_date' && slot.endDate) {
    const endDate = new Date(slot.endDate);
    endDate.setHours(23, 59, 59, 999); // End of the day
    return date <= endDate;
  }
  
  if (slot.ends === 'after_occurrences' && slot.occurrences) {
    return occurrenceCount < slot.occurrences;
  }
  
  return true;
}

function generateRecurrenceRule(slot: AvailabilitySlot): string {
  if (slot.frequency === 'never') {
    return '';
  }
  
  const frequency = slot.frequency === 'weekly' ? 'WEEKLY' : 
                   slot.frequency === 'biweekly' ? 'WEEKLY' : 
                   slot.frequency === 'monthly' ? 'MONTHLY' : 'DAILY';
  
  const interval = slot.frequency === 'biweekly' ? 2 : 1;
  
  let rule = `FREQ=${frequency};INTERVAL=${interval}`;
  
  if (slot.days.length > 0) {
    const byDay = slot.days.map(day => day.toUpperCase().substring(0, 2)).join(',');
    rule += `;BYDAY=${byDay}`;
  }
  
  if (slot.ends === 'on_date' && slot.endDate) {
    rule += `;UNTIL=${slot.endDate.replace(/-/g, '')}T235959Z`;
  } else if (slot.ends === 'after_occurrences' && slot.occurrences) {
    rule += `;COUNT=${slot.occurrences}`;
  }
  
  return rule;
}

function getDayName(date: Date): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[date.getDay()];
}

function normalizeDayName(dayName: string): string {
  const dayMap: { [key: string]: string } = {
    'Mon': 'monday',
    'Tue': 'tuesday', 
    'Wed': 'wednesday',
    'Thu': 'thursday',
    'Fri': 'friday',
    'Sat': 'saturday',
    'Sun': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday', 
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday'
  };
  return dayMap[dayName] || dayName;
}

export function formatAvailabilitySummary(slot: AvailabilitySlot): string {
  if (slot.frequency === 'never') {
    if (slot.endDate) {
      const date = new Date(slot.endDate);
      return `Single occurrence on ${date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })}`;
    }
    return "Single occurrence (date not specified)";
  }
  
  if (slot.days.length === 0) return "No recurrence set";
  
  const daysText = slot.days.join('-');
  const frequencyText = slot.frequency === 'weekly' ? 'week' : 
                       slot.frequency === 'biweekly' ? '2 weeks' : 'month';
  
  let summary = `Repeats ${daysText} every ${frequencyText}`;
  
  if (slot.ends === 'on_date' && slot.endDate) {
    const endDate = new Date(slot.endDate);
    summary += ` until ${endDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`;
  } else if (slot.ends === 'after_occurrences' && slot.occurrences) {
    summary += ` (${slot.occurrences} times)`;
  }
  
  return summary;
}

export function getTimeRangeText(startTime: string, endTime: string): string {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };
  
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}
