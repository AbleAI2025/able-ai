import { CalendarEvent } from "@/app/types/CalendarEventTypes";

export const MOCK_EVENTS: CalendarEvent[] = [
  { title: 'Shift at cafe: Waiter', start: new Date(new Date().setHours(10, 0, 0, 0)), end: new Date(new Date().setHours(11, 30, 0, 0)), status: 'ACCEPTED', workerName: 'You' },
  { title: 'Bartender, Central Station', start: new Date(new Date().setHours(13, 0, 0, 0)), end: new Date(new Date().setHours(21, 0, 0, 0)), status: 'OFFER' },
  { title: 'Unavailable: Doctor Appointment', start: new Date(new Date().setHours(8, 0, 0, 0)), end: new Date(new Date().setHours(9, 30, 0, 0)), status: 'UNAVAILABLE' },
  { title: 'Gig in progress', start: new Date(new Date().setHours(12, 0, 0, 0)), end: new Date(new Date().setHours(14, 0, 0, 0)), status: 'IN_PROGRESS' },
  { title: 'Completed gig', start: new Date(new Date().setHours(15, 0, 0, 0)), end: new Date(new Date().setHours(17, 0, 0, 0)), status: 'COMPLETED' },
  { title: 'Cancelled gig', start: new Date(new Date().setHours(18, 0, 0, 0)), end: new Date(new Date().setHours(19, 0, 0, 0)), status: 'CANCELLED' },
];
