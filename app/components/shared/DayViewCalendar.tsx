import React from 'react';
import moment from 'moment';
import { Eye } from 'lucide-react';
import styles from './DayViewCalendar.module.css';
import CalendarEventComponent from './CalendarEventComponent';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status?: "PENDING" | "ACCEPTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "UNAVAILABLE" | "OFFER";
  buyerName?: string;
  workerName?: string;
  location?: string;
  description?: string;
}

interface DayViewCalendarProps {
  events: Event[];
  currentDate: Date;
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  userRole?: string;
}

const DayViewCalendar: React.FC<DayViewCalendarProps> = ({
  events,
  currentDate,
  onEventClick,
  onDateClick,
  userRole = 'buyer'
}) => {
  // Generate array of hours from 6 AM to 10 PM (18 hours total)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

  // Get events for the current day
  const dayEvents = events.filter(event => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const dayStart = moment(currentDate).startOf('day');
    const dayEnd = moment(currentDate).endOf('day');
    
    return eventStart.isBefore(dayEnd) && eventEnd.isAfter(dayStart);
  });

  const handleEventClick = (event: Event) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const getEventsForTimeSlot = (hour: number) => {
    return dayEvents.filter(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      const slotStart = moment(currentDate).hour(hour).minute(0);
      const slotEnd = moment(currentDate).hour(hour).minute(59);
      
      return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
    });
  };

  const getEventSpanInfo = (event: Event, hour: number) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const slotStart = moment(currentDate).hour(hour).minute(0);
    const slotEnd = moment(currentDate).hour(hour).minute(59);
    
    const startPosition = Math.max(0, eventStart.diff(slotStart, 'minutes'));
    const endPosition = Math.min(60, eventEnd.diff(slotStart, 'minutes'));
    const totalMinutes = endPosition - startPosition;
    
    return {
      startPosition: (startPosition / 60) * 100,
      endPosition: (endPosition / 60) * 100,
      totalMinutes
    };
  };

  // Calculate event positioning for the entire day
  const getEventPosition = (event: Event) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const dayStart = moment(currentDate).startOf('day');
    const dayStart6AM = moment(currentDate).startOf('day').add(6, 'hours');
    
    // Calculate start position (minutes from 6 AM, not start of day)
    const startMinutes = Math.max(0, eventStart.diff(dayStart6AM, 'minutes'));
    const endMinutes = Math.min(18 * 60, eventEnd.diff(dayStart6AM, 'minutes')); // 18 hours max (6 AM to 12 AM)
    
    // Convert to pixels (assuming 60px per hour)
    const startPixels = (startMinutes / 60) * 60;
    const heightPixels = ((endMinutes - startMinutes) / 60) * 60;
    
    // If event starts after 12 PM, don't show it
    if (startMinutes >= 18 * 60) {
      return {
        top: 0,
        height: 0,
        startHour: eventStart.hour(),
        endHour: eventEnd.hour(),
        visible: false
      };
    }
    
    return {
      top: startPixels,
      height: Math.max(heightPixels, 20), // Minimum height of 20px
      startHour: eventStart.hour(),
      endHour: eventEnd.hour(),
      visible: true
    };
  };

  return (
    <div className={styles.dayViewContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.timeColumn}>
          <div className={styles.timeHeader}>Time</div>
        </div>
        <div className={styles.dayColumn}>
          <div className={styles.dayHeader}>
            <div className={styles.dayName}>
              {moment(currentDate).format('dddd')}
            </div>
            <div className={styles.dayNumber}>
              {moment(currentDate).format('D')}
            </div>
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div className={styles.timeGrid}>
        {hours.map((hour) => (
          <div key={hour} className={styles.timeRow}>
            <div className={styles.timeLabel}>
              {moment().startOf('day').add(hour, 'hours').format('HH:mm')}
            </div>
            <div className={styles.timeSlot}>
              {/* Empty time slots - events will be rendered separately */}
            </div>
          </div>
        ))}
        
        {/* Events Container - positioned absolutely within the time grid */}
        <div className={styles.eventsContainer}>
          {dayEvents.map((event, eventIndex) => {
            const position = getEventPosition(event);
            
            // Only render visible events
            if (!position.visible) {
              return null;
            }
            
            return (
              <div
                key={`event-${event.id || eventIndex}`}
                className={styles.eventBlock}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventClick(event);
                }}
                style={{
                  height: `${position.height}px`,
                  margin: '0',
                  position: 'absolute',
                  top: `${position.top}px`,
                  left: '0px',
                  right: '0px',
                  zIndex: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  MozUserSelect: 'none',
                  msUserSelect: 'none',
                  outline: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',

                  flexDirection: 'column'
                }}
              >
                <CalendarEventComponent event={event} userRole={userRole} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayViewCalendar;
