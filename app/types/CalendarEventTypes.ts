export enum EventStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UNAVAILABLE = 'UNAVAILABLE',
  OFFER = 'OFFER',
  AVAILABLE = 'AVAILABLE',
}

// Define the interface for calendar events (should be consistent with BuyerCalendarPage)
export type EventStatusEnumType = `${EventStatusEnum}`
export interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Record<string, unknown>;
  status?: EventStatusEnumType;
  eventType?: 'gig' | 'offer' | 'unavailability' | 'availability';
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
  location?: string;
  description?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  originalSlotId?: string;
}

