'use client';

import React, { useState, useEffect } from 'react';
import AppCalendar from '@/app/components/shared/AppCalendar';
import CalendarHeader from '@/app/components/shared/CalendarHeader';
import CalendarEventComponent from '@/app/components/shared/CalendarEventComponent';
import { View } from 'react-big-calendar';
// Import the CSS module for this page
import styles from './WorkerCalendarPage.module.css';

// Define the interface for calendar events (should be consistent with BuyerCalendarPage)
interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'UNAVAILABLE' | 'OFFER';
  eventType?: 'gig' | 'offer' | 'unavailability';
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
}

const FILTERS = [
  'Manage availability',
  'Accepted gigs',
  'See gig offers',
];

const MOCK_EVENTS: CalendarEvent[] = [
  { title: 'Shift at cafe: Waiter', start: new Date(new Date().setHours(10, 0, 0, 0)), end: new Date(new Date().setHours(11, 30, 0, 0)), status: 'ACCEPTED', workerName: 'You' },
  { title: 'Bartender, Central Station', start: new Date(new Date().setHours(13, 0, 0, 0)), end: new Date(new Date().setHours(21, 0, 0, 0)), status: 'OFFER' },
  { title: 'Unavailable: Doctor Appointment', start: new Date(new Date().setHours(8, 0, 0, 0)), end: new Date(new Date().setHours(9, 30, 0, 0)), status: 'UNAVAILABLE' },
  { title: 'Gig in progress', start: new Date(new Date().setHours(12, 0, 0, 0)), end: new Date(new Date().setHours(14, 0, 0, 0)), status: 'IN_PROGRESS' },
  { title: 'Completed gig', start: new Date(new Date().setHours(15, 0, 0, 0)), end: new Date(new Date().setHours(17, 0, 0, 0)), status: 'COMPLETED' },
  { title: 'Cancelled gig', start: new Date(new Date().setHours(18, 0, 0, 0)), end: new Date(new Date().setHours(19, 0, 0, 0)), status: 'CANCELLED' },
];

// Helper to filter events based on active filter
function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  switch (filter) {
    case 'Manage availability':
      return events.filter(e => e.status === 'UNAVAILABLE');
    case 'Accepted gigs':
      return events.filter(e => e.status === 'ACCEPTED');
    case 'See gig offers':
      return events.filter(e => e.status === 'OFFER');
    default:
      return events;
  }
}

const WorkerCalendarPage = () => {
  // Real events would be fetched or passed in here
  const realEvents: CalendarEvent[] = [];

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'day';
    }
    return 'week';
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[1]);
  const [events, setEvents] = useState<CalendarEvent[]>(realEvents);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      const baseEvents = isViewQA ? MOCK_EVENTS : realEvents;
      setEvents(filterEvents(baseEvents, activeFilter));
      // Ensure view is 'day' on mobile after mount (for SSR safety)
      if (window.innerWidth < 768) {
        setView('day');
      }
    }
  }, [activeFilter, realEvents]);

  // Calendar navigation handler
  const handleNavigate = (action: 'TODAY' | 'PREV' | 'NEXT') => {
    const current = new Date(date);
    if (action === 'TODAY') {
      setDate(new Date());
    } else if (action === 'PREV') {
      if (view === 'day') current.setDate(current.getDate() - 1);
      if (view === 'week') current.setDate(current.getDate() - 7);
      if (view === 'month') current.setMonth(current.getMonth() - 1);
      setDate(current);
    } else if (action === 'NEXT') {
      if (view === 'day') current.setDate(current.getDate() + 1);
      if (view === 'week') current.setDate(current.getDate() + 7);
      if (view === 'month') current.setMonth(current.getMonth() + 1);
      setDate(current);
    }
  };

  // When filter changes, update events
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    if (typeof window !== 'undefined') {
      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      const baseEvents = isViewQA ? MOCK_EVENTS : realEvents;
      setEvents(filterEvents(baseEvents, filter));
    }
  };

  return (
    <div className={styles.container}>
      <CalendarHeader
        date={date}
        view={view}
        onViewChange={setView}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />
      <main className={styles.mainContent}>
        <AppCalendar
          events={events}
          view={view}
          onView={setView}
          onNavigate={setDate}
          components={{ event: (props: any) => <CalendarEventComponent {...props} userRole="worker" /> }}
          hideToolbar={true}
        />
      </main>
      <footer className={styles.footer}>
        <button className={styles.homeButton}>🏠</button>
      </footer>
    </div>
  );
};

export default WorkerCalendarPage; 