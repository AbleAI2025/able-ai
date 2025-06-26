'use client';

import React, { useState, useEffect } from 'react';
import AppCalendar from '@/app/components/shared/AppCalendar';
import CalendarHeader from '@/app/components/shared/CalendarHeader';
import CalendarEventComponent from '@/app/components/shared/CalendarEventComponent';
import { View } from 'react-big-calendar';
import { useAuth } from '@/context/AuthContext';
import { CalendarEvent } from '@/app/types/CalendarEventTypes';
import { getCalendarEvents } from '@/actions/events/get-calendar-events';
// Import the CSS module for this page
import styles from './WorkerCalendarPage.module.css';

const FILTERS = [
  'Manage availability',
  'Accepted gigs',
  'See gig offers',
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
  const { user } = useAuth();

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'day';
    }
    return 'week';
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[1]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      const res = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA });

      if(res.error) throw new Error(res.error);

      const data: CalendarEvent[] = res.events;

      const parsed = data.map((event: any) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
      setEvents(filterEvents(parsed, activeFilter));
    };

    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  useEffect(() => {
    // Ensure view is 'day' on mobile after mount (for SSR safety)
    if (window.innerWidth < 768) {
      setView('day');
    }
  }, [activeFilter]);

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
    setEvents(filterEvents(events, filter));
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
          date={date}
          events={events}
          view={view}
          onView={setView}
          onNavigate={setDate}
          components={{
            event: (props: any) => (
              <CalendarEventComponent {...props} userRole="worker" />
            )
          }}
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