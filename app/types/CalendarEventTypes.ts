export enum EventStatusEnum {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UNAVAILABLE = 'UNAVAILABLE',
  OFFER = 'OFFER',
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
  eventType?: 'gig' | 'offer' | 'unavailability';
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
}

