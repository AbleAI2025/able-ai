import { CalendarEvent } from "@/app/types/CalendarEventTypes";

export const MOCK_EVENTS: CalendarEvent[] = [
  { 
    title: 'Shift at cafe: Waiter', 
    start: new Date(2025, 7, 7, 10, 0, 0, 0), // August 7th, 2025 at 10:00 AM
    end: new Date(2025, 7, 7, 11, 30, 0, 0), // August 7th, 2025 at 11:30 AM (same day)
    status: 'ACCEPTED', 
    workerName: 'You', 
    id: 'dsafe-ddwarw-dsadsad32d-dsadd',
    allDay: false, // Explicitly set as not all-day
    location: 'Central Park'
  },
  { 
    title: 'Bartender, Central Station', 
    start: new Date(2025, 7, 8, 13, 0, 0, 0), // August 8th, 2025 at 1:00 PM
    end: new Date(2025, 7, 8, 21, 0, 0, 0), // August 8th, 2025 at 9:00 PM
    status: 'OFFER',
    allDay: false,
    location: 'Central Park'
  },
  { 
    title: 'Unavailable: Doctor Appointment', 
    start: new Date(2025, 7, 9, 8, 0, 0, 0), // August 9th, 2025 at 8:00 AM
    end: new Date(2025, 7, 9, 9, 30, 0, 0), // August 9th, 2025 at 9:30 AM
    status: 'UNAVAILABLE',
    allDay: false,
    location: 'Doctor\'s Office'
  },
  { 
    title: 'Gig in progress', 
    start: new Date(2025, 7, 10, 12, 0, 0, 0), // August 10th, 2025 at 12:00 PM
    end: new Date(2025, 7, 10, 14, 0, 0, 0), // August 10th, 2025 at 2:00 PM
    status: 'IN_PROGRESS',
    allDay: false,
    location: 'Central Park'
  },
  { 
    title: 'Completed gig', 
    start: new Date(2025, 7, 11, 15, 0, 0, 0), // August 11th, 2025 at 3:00 PM
    end: new Date(2025, 7, 11, 17, 0, 0, 0), // August 11th, 2025 at 5:00 PM
    status: 'COMPLETED',
    allDay: false,
    location: 'Central Park'
  },
  { 
    title: 'Cancelled gig', 
    start: new Date(2025, 7, 12, 18, 0, 0, 0), // August 12th, 2025 at 6:00 PM
    end: new Date(2025, 7, 12, 19, 0, 0, 0), // August 12th, 2025 at 7:00 PM
    status: 'CANCELLED',
    allDay: false,
    location: 'Central Park'
  },
];
