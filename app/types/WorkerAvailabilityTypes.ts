// File: app/types/WorkerAvailabilityTypes.ts

export interface WorkerAvailability {
  id: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkerAvailabilityInput {
  userId: string;
  startTime: Date;
  endTime: Date;
  notes?: string;
}

export interface UpdateWorkerAvailabilityInput {
  availabilityId: string;
  userId: string;
  startTime?: Date;
  endTime?: Date;
  notes?: string;
}

export interface DeleteWorkerAvailabilityInput {
  availabilityId: string;
  userId: string;
}

export interface ListWorkerAvailabilityInput {
  userId: string;
  startDate?: Date;
  endDate?: Date;
}

export interface WorkerAvailabilityResponse {
  success?: boolean;
  error?: string;
  availability?: WorkerAvailability;
  availabilities?: WorkerAvailability[];
}

// Calendar event mapping for the new availability system
export interface WorkerAvailabilityCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  status: 'UNAVAILABLE';
  eventType: 'unavailability';
  notes?: string;
  resource: {
    availabilityId: string;
    userId: string;
  };
}
