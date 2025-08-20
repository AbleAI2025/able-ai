import { AvailabilitySlot, AvailabilityEvent } from "@/app/types/AvailabilityTypes";

export function convertAvailabilitySlotsToEvents(slots: AvailabilitySlot[], startDate: Date, endDate: Date): AvailabilityEvent[] {
  const events: AvailabilityEvent[] = [];
  
  // Safety check: ensure slots is an array
  if (!Array.isArray(slots)) {
    console.warn('convertAvailabilitySlotsToEvents: slots is not an array:', slots);
    return events;
  }
  
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
  
  // Debug logging to see what we're working with
  console.log(`generateEventsFromSlot called with:`, {
    frequency: slot.frequency,
    days: slot.days,
    ends: slot.ends,
    occurrences: slot.occurrences,
    startDate: startDate.toDateString(),
    endDate: endDate.toDateString()
  });
  
  // Start from the slot's startDate if provided, otherwise use the provided startDate
  const slotStartDate = slot.startDate ? new Date(slot.startDate) : startDate;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Use the later of: slot start date, provided start date, or today
  const effectiveStartDate = new Date(Math.max(
    slotStartDate.getTime(), 
    startDate.getTime(), 
    today.getTime()
  ));
  
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
  let occurrenceCount = 0;
  
  // Start from the effective start date
  let currentDate = new Date(effectiveStartDate);
  
  // For biweekly, we need to find the first occurrence to establish the pattern
  let firstOccurrenceDate: Date | null = null;
  if (slot.frequency === 'biweekly') {
    // Find the first occurrence of any of our target days
    let tempDate = new Date(effectiveStartDate);
    while (tempDate <= endDate) {
      const dayName = getDayName(tempDate);
      const normalizedDayName = normalizeDayName(dayName);
      
      if (slot.days.includes(normalizedDayName)) {
        firstOccurrenceDate = new Date(tempDate);
        break;
      }
      tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
    }
  }
  
  while (currentDate <= endDate) {
    const dayName = getDayName(currentDate);
    const normalizedDayName = normalizeDayName(dayName);
    
    if (slot.days.includes(normalizedDayName)) {
      // Check if this occurrence should be created based on frequency
      let shouldCreate = false;
      
      if (slot.frequency === 'weekly') {
        // Weekly: create every occurrence
        shouldCreate = true;
      } else if (slot.frequency === 'biweekly') {
        // Biweekly: create only every other week
        console.log(`Processing biweekly frequency for date: ${currentDate.toDateString()}`);
        if (firstOccurrenceDate) {
          // Calculate days since first occurrence
          const daysSinceFirst = Math.floor((currentDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
          const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
          // Create events only on even weeks (0, 2, 4, 6, etc.)
          shouldCreate = weeksSinceFirst % 2 === 0;
          
          console.log(`Biweekly: date=${currentDate.toDateString()}, daysSinceFirst=${daysSinceFirst}, weeksSinceFirst=${weeksSinceFirst}, shouldCreate=${shouldCreate}`);
        } else {
          console.log(`No firstOccurrenceDate found for biweekly`);
        }
      } else if (slot.frequency === 'monthly') {
        // Monthly: create only once per month per day
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const monthKey = `${currentYear}-${currentMonth}`;
        
        // Check if we've already created an event for this month and day
        const monthDayKey = `${monthKey}-${normalizedDayName}`;
        const existingEvent = events.find(event => {
          const eventDate = new Date(event.start);
          const eventMonth = eventDate.getMonth();
          const eventYear = eventDate.getFullYear();
          const eventDayName = getDayName(eventDate);
          const eventNormalizedDayName = normalizeDayName(eventDayName);
          return eventMonth === currentMonth && eventYear === currentYear && eventNormalizedDayName === normalizedDayName;
        });
        
        shouldCreate = !existingEvent;
      }
      
      if (shouldCreate && shouldCreateEventForDate(slot, currentDate, occurrenceCount)) {
        const event = createEventFromSlot(slot, currentDate);
        if (event) {
          events.push(event);
          occurrenceCount++;
          
          // Check if we've reached the maximum occurrences
          if (slot.ends === 'after_occurrences' && slot.occurrences) {
            let shouldStop = false;
            
            if (slot.frequency === 'weekly') {
              // For weekly: stop after N occurrences (individual events)
              shouldStop = occurrenceCount >= slot.occurrences;
            } else if (slot.frequency === 'biweekly') {
              // For biweekly: stop after N weeks (each week has slot.days.length events)
              const weeksCompleted = Math.ceil(occurrenceCount / slot.days.length);
              shouldStop = weeksCompleted >= slot.occurrences;
              console.log(`Biweekly occurrence check: occurrenceCount=${occurrenceCount}, days.length=${slot.days.length}, weeksCompleted=${weeksCompleted}, shouldStop=${shouldStop}`);
            } else if (slot.frequency === 'monthly') {
              // For monthly: stop after N months (each month has slot.days.length events)
              const monthsCompleted = Math.ceil(occurrenceCount / slot.days.length);
              shouldStop = monthsCompleted >= slot.occurrences;
            }
            
            if (shouldStop) {
              console.log(`Stopping due to occurrence limit: ${slot.occurrences}`);
              break;
            }
          }
        }
      }
    }
    
    // Advance by one day
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }
  
  return events;
}

// Helper function to get week of year
function getWeekOfYear(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
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
  
  // Debug logging
  console.log('createEventFromSlot:', {
    slotId: slot.id,
    date: date.toDateString(),
    startTime: slot.startTime,
    endTime: slot.endTime,
    eventStart: eventStart.toISOString(),
    eventEnd: eventEnd.toISOString(),
    startHour,
    startMinute,
    endHour,
    endMinute
  });
  
  return {
    id: `${slot.id}-${date.toISOString().split('T')[0]}`,
    title: slot.notes ? `Available: ${slot.notes}` : 'Available',
    start: eventStart,
    end: eventEnd,
    allDay: false,
    status: 'AVAILABLE',
    eventType: 'availability',
    isRecurring: slot.frequency !== 'never',
    recurrenceRule: generateRecurrenceRule(slot),
    originalSlotId: slot.id,
    notes: slot.notes,
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
  
  // Note: occurrence limits are now handled in the main loop
  // This function only checks date-based conditions
  
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
