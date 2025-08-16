import { AvailabilitySlot, AvailabilityEvent } from "@/app/types/AvailabilityTypes";

export function convertAvailabilitySlotsToEvents(slots: AvailabilitySlot[], startDate: Date, endDate: Date): AvailabilityEvent[] {
  const events: AvailabilityEvent[] = [];
  
  slots.forEach(slot => {
    const slotEvents = generateEventsFromSlot(slot, startDate, endDate);
    events.push(...slotEvents);
  });
  
  return events;
}

function generateEventsFromSlot(slot: AvailabilitySlot, startDate: Date, endDate: Date): AvailabilityEvent[] {
  const events: AvailabilityEvent[] = [];
  
  // Start from today if the provided start date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const effectiveStartDate = new Date(Math.max(startDate.getTime(), today.getTime()));
  const currentDate = new Date(effectiveStartDate);
  
  while (currentDate <= endDate) {
    const dayName = getDayName(currentDate);
    
    if (slot.days.includes(dayName)) {
      const shouldCreateEvent = shouldCreateEventForDate(slot, currentDate);
      
      if (shouldCreateEvent) {
        const eventStart = new Date(currentDate);
        const eventEnd = new Date(currentDate);
        
        // Set start time
        const [startHour, startMinute] = slot.startTime.split(':').map(Number);
        eventStart.setHours(startHour, startMinute, 0, 0);
        
        // Set end time
        const [endHour, endMinute] = slot.endTime.split(':').map(Number);
        eventEnd.setHours(endHour, endMinute, 0, 0);
        
        // Create the availability event
        events.push({
          id: `${slot.id}-${currentDate.toISOString().split('T')[0]}`,
          title: 'Available',
          start: eventStart,
          end: eventEnd,
          allDay: false,
          status: 'AVAILABLE',
          eventType: 'availability',
          isRecurring: slot.frequency !== 'never', // false for single occurrences
          recurrenceRule: generateRecurrenceRule(slot), // empty string for single occurrences
          originalSlotId: slot.id,
        });
      }
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return events;
}

function shouldCreateEventForDate(slot: AvailabilitySlot, date: Date): boolean {
  // Don't create events for dates that have already passed
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today
  const eventDate = new Date(date);
  eventDate.setHours(0, 0, 0, 0); // Start of the event date
  
  if (eventDate < today) {
    return false;
  }
  
  if (slot.ends === 'never') {
    return true;
  }
  
  if (slot.ends === 'on_date' && slot.endDate) {
    const endDate = new Date(slot.endDate);
    return date <= endDate;
  }
  
  if (slot.ends === 'after_occurrences' && slot.occurrences) {
    // This is a simplified implementation
    // In a real app, you'd need to track how many occurrences have been created
    return true;
  }
  
  return true;
}

function generateRecurrenceRule(slot: AvailabilitySlot): string {
  // For single occurrences (never frequency), don't generate a recurrence rule
  if (slot.frequency === 'never') {
    return '';
  }
  
  const dayNumbers = slot.days.map(day => getDayNumber(day)).join(',');
  
  let rule = `FREQ=WEEKLY;BYDAY=${dayNumbers}`;
  
  if (slot.frequency === 'biweekly') {
    rule += ';INTERVAL=2';
  } else if (slot.frequency === 'monthly') {
    rule = rule.replace('WEEKLY', 'MONTHLY');
  }
  
  if (slot.ends === 'on_date' && slot.endDate) {
    rule += `;UNTIL=${slot.endDate.replace(/-/g, '')}`;
  } else if (slot.ends === 'after_occurrences' && slot.occurrences) {
    rule += `;COUNT=${slot.occurrences}`;
  }
  
  return rule;
}

function getDayName(date: Date): string {
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayIndex = date.getDay();
  // Convert Sunday=0 to Monday=0 format
  const mondayBasedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  return dayNames[mondayBasedIndex];
}

function getDayNumber(dayName: string): string {
  const dayMap: { [key: string]: string } = {
    'Mon': 'MO',
    'Tue': 'TU',
    'Wed': 'WE',
    'Thu': 'TH',
    'Fri': 'FR',
    'Sat': 'SA',
    'Sun': 'SU',
  };
  return dayMap[dayName] || 'MO';
}

export function formatAvailabilitySummary(slot: AvailabilitySlot): string {
  const daysText = slot.days.join('-');
  
  if (slot.frequency === 'never') {
    return `Single occurrence on ${daysText}`;
  }
  
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
