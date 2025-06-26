/* eslint-disable @typescript-eslint/ban-ts-comment */
import React from 'react';
import { Calendar as BigCalendar, Formats, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import styles from './AppCalendar.module.css';

const localizer = momentLocalizer(moment);

type AppCalendarProps<TEvent> = {
  events: TEvent[];
  date: Date;
  view?: View;
  defaultView?: View;
  onSelectEvent?: (event: TEvent) => void;
  onNavigate?: (date: Date) => void;
  onView?: (view: View) => void;
  minTime?: Date;
  maxTime?: Date;
  eventPropGetter?: (event: TEvent) => { style: React.CSSProperties };
  components?: Record<string, React.ComponentType<unknown>>;
  height?: string;
  hideToolbar?: boolean;
  formats?: Formats | undefined;
};

const AppCalendar = <TEvent extends object>({
  events = [],
  view,
  date,
  defaultView = 'month',
  onSelectEvent,
  onNavigate,
  onView,
  minTime,
  maxTime,
  eventPropGetter,
  components,
  height = "70vh",
  hideToolbar = false,
  formats = {
    eventTimeRangeFormat: () => ''
  },
}: AppCalendarProps<TEvent>) => {
  const defaultEventPropGetter = (event: TEvent) => {
    const style: React.CSSProperties = {
      backgroundColor: '#3a3a3a',
      borderRadius: '8px',
      color: '#e0e0e0',
      border: '1px solid #525252',
      display: 'block',
      opacity: 1,
      fontSize: '0.8rem',
      padding: '0.3rem 0.5rem',
    };
    // @ts-ignore
    switch (event.status) {
      case 'PENDING':
      case 'OFFER':
        style.backgroundColor = '#525252';
        style.borderColor = '#404040';
        style.color = '#e0e0e0';
        break;
      case 'ACCEPTED':
        // @ts-ignore
        if (event.isBuyerAccepted) {
          style.backgroundColor = 'var(--buyer-accent-color, #22d3ee)';
          style.borderColor = 'var(--buyer-accent-darker-color, #06b6d4)';
        } else {
          style.backgroundColor = 'var(--primary-color)';
          style.borderColor = 'var(--primary-darker-color, #2563eb)';
        }
        style.color = 'white';
        break;
      case 'IN_PROGRESS':
        style.backgroundColor = '#f59e0b';
        style.borderColor = '#d97706';
        style.color = '161616';
        break;
      case 'COMPLETED':
        style.backgroundColor = 'var(--success-color)';
        style.borderColor = '#059669';
        style.opacity = 0.8;
        break;
      case 'CANCELLED':
        style.backgroundColor = 'var(--error-color)';
        style.borderColor = '#b91c1c';
        style.opacity = 0.7;
        style.textDecoration = 'line-through';
        break;
      case 'UNAVAILABLE':
        style.backgroundColor = '#4b5563';
        style.borderColor = '#374151';
        style.opacity = 0.9;
        break;
    }
    return { style };
  };

  const calendarComponents = {
    ...components,
    ...(hideToolbar ? { toolbar: () => null } : {}),
  };

  // Wrap onSelectEvent to match the expected signature
  const handleSelectEvent = onSelectEvent
    ? (event: object) => onSelectEvent(event as TEvent)
    : undefined;

  // Wrap eventPropGetter to match the expected signature
  const handleEventPropGetter = eventPropGetter
    ? (event: object) => eventPropGetter(event as TEvent)
    : (defaultEventPropGetter);

  return (
    <div className={styles.calendarWrapper} style={{ height }}>
      <BigCalendar
        localizer={localizer}
        events={events}
        date={date}
        view={view}
        startAccessor={(event: TEvent) => (event as { start: Date }).start}
        endAccessor={(event: TEvent) => (event as { end: Date }).end}
        allDayAccessor={(event: { allDay?: boolean }) => event.allDay || false}
        titleAccessor={(event: TEvent & { title?: string }) => event.title || ''}
        defaultView={defaultView}
        views={['month', 'week', 'day', 'agenda']}
        selectable={false}
        onSelectEvent={handleSelectEvent}
        onNavigate={onNavigate}
        onView={onView}
        min={minTime}
        max={maxTime}
        eventPropGetter={handleEventPropGetter}
        components={calendarComponents}
        formats={formats}
        popup
      />
    </div>
  );
};

export default AppCalendar; 