export interface AvailabilitySlot {
  id: string;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  days: string[]; // ['Mon', 'Tue', 'Wed', etc.]
  frequency: 'never' | 'weekly' | 'biweekly' | 'monthly';
  ends: 'never' | 'on_date' | 'after_occurrences';
  startDate?: string; // ISO date string - when the recurring pattern should start
  endDate?: string; // ISO date string
  occurrences?: number;
  notes?: string; // Optional notes about the availability period
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilityFormData {
  startTime: string;
  endTime: string;
  days: string[];
  frequency: 'never' | 'weekly' | 'biweekly' | 'monthly';
  ends: 'never' | 'on_date' | 'after_occurrences';
  startDate?: string; // ISO date string - when the recurring pattern should start
  endDate?: string;
  occurrences?: number;
  notes?: string; // Optional notes about the availability period
}

export interface AvailabilityEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: 'AVAILABLE';
  eventType: 'availability';
  isRecurring: boolean;
  recurrenceRule?: string;
  originalSlotId?: string;
  notes?: string;
}
