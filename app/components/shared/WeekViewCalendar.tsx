import React from 'react';
import moment from 'moment';
import { Eye } from 'lucide-react';
import styles from './WeekViewCalendar.module.css';

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource?: any;
  status?: string;
}

interface WeekViewCalendarProps {
  events: Event[];
  currentDate: Date;
  onEventClick?: (event: Event) => void;
  onDateClick?: (date: Date) => void;
  userRole?: string;
}

const WeekViewCalendar: React.FC<WeekViewCalendarProps> = ({
  events,
  currentDate,
  onEventClick,
  onDateClick,
  userRole = 'buyer'
}) => {
  // Get the start of the week (Monday)
  const startOfWeek = moment(currentDate).startOf('week');
  
  // Generate array of 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    moment(startOfWeek).add(i, 'days').toDate()
  );

  // Generate array of hours from 6 AM to 11 PM (18 hours total)
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get events for the current week
  const weekEvents = events.filter(event => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const weekStart = moment(startOfWeek);
    const weekEnd = moment(startOfWeek).endOf('week');
    
    return eventStart.isBefore(weekEnd) && eventEnd.isAfter(weekStart);
  });

  // Debug logging
  console.log('WeekViewCalendar Debug:', {
    totalEvents: events.length,
    weekEvents: weekEvents.length,
    currentDate: currentDate,
    startOfWeek: startOfWeek.format('YYYY-MM-DD'),
    weekEnd: moment(startOfWeek).endOf('week').format('YYYY-MM-DD'),
    events: events.map(e => ({
      id: e.id,
      title: e.title,
      start: moment(e.start).format('YYYY-MM-DD HH:mm'),
      end: moment(e.end).format('YYYY-MM-DD HH:mm'),
      status: e.status
    }))
  });

  const handleDateClick = (date: Date) => {
    if (onDateClick) {
      onDateClick(date);
    }
  };

  const handleEventClick = (event: Event) => {
    if (onEventClick) {
      onEventClick(event);
    }
  };

  const getEventsForTimeSlot = (day: Date, hour: number) => {
    return weekEvents.filter(event => {
      const eventStart = moment(event.start);
      const eventEnd = moment(event.end);
      const slotStart = moment(day).hour(hour).minute(0);
      const slotEnd = moment(day).hour(hour).minute(59);
      
      return eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
    });
  };

  const getEventDisplayInfo = (event: Event, day: Date, hour: number) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const slotStart = moment(day).hour(hour).minute(0);
    const slotEnd = moment(day).hour(hour).minute(59);
    
    // Check if this event overlaps with this time slot at all
    const hasOverlap = eventStart.isBefore(slotEnd) && eventEnd.isAfter(slotStart);
    
    if (!hasOverlap) {
      return { shouldShow: false, isStart: false, isEnd: false, isContinue: false };
    }
    
    // Check if this event starts in this time slot
    const isEventStart = eventStart.isSameOrAfter(slotStart) && eventStart.isBefore(slotEnd);
    
    // Check if this event ends in this time slot
    const isEventEnd = eventEnd.isAfter(slotStart) && eventEnd.isSameOrBefore(slotEnd);
    
    // Check if this event continues through this time slot (starts before and ends after)
    const isEventContinue = eventStart.isBefore(slotStart) && eventEnd.isAfter(slotEnd);
    
    // Calculate the top position for events that start within this hour
    let topPosition = 0;
    if (isEventStart) {
      const minutesFromStart = eventStart.diff(slotStart, 'minutes');
      topPosition = (minutesFromStart / 60) * 100; // Convert to percentage
    }
    
    // Calculate the height for events that end within this hour
    let height = 100;
    if (isEventEnd) {
      const minutesFromStart = eventEnd.diff(slotStart, 'minutes');
      height = (minutesFromStart / 60) * 100; // Convert to percentage
    }
    
    return {
      shouldShow: true,
      isStart: isEventStart,
      isEnd: isEventEnd,
      isContinue: isEventContinue,
      topPosition,
      height
    };
  };

  const getEventSpanInfo = (event: Event, day: Date) => {
    const eventStart = moment(event.start);
    const eventEnd = moment(event.end);
    const dayStart = moment(day).startOf('day');
    
    // Calculate which hours this event spans
    const startHour = eventStart.hour();
    const endHour = eventEnd.hour();
    
    // Calculate the start position within the first hour
    const startMinutes = eventStart.minutes();
    const startPosition = (startMinutes / 60) * 100;
    
    // Calculate the end position within the last hour
    const endMinutes = eventEnd.minutes();
    const endPosition = (endMinutes / 60) * 100;
    
    return {
      startHour,
      endHour,
      startPosition,
      endPosition,
      totalHours: endHour - startHour + 1
    };
  };

  return (
    <div className={styles.weekViewContainer}>
      {/* Header with day names */}
      <div className={styles.header}>
        <div className={styles.timeColumn}></div>
        {weekDays.map((day) => (
          <div 
            key={`day-${moment(day).format('YYYY-MM-DD')}`} 
            className={styles.dayHeader}
            onClick={() => handleDateClick(day)}
          >
            <div className={styles.dayName}>
              {moment(day).format('ddd')}
            </div>
            <div className={styles.dayNumber}>
              {moment(day).format('D')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className={styles.timeGrid}>
        {hours.map(hour => (
          <div key={hour} className={styles.timeRow}>
            <div className={styles.timeLabel}>
              {moment().startOf('day').add(hour, 'hours').format('HH:mm')}
            </div>
            {weekDays.map((day) => (
              <div 
                key={`slot-${moment(day).format('YYYY-MM-DD')}-${hour}`} 
                className={styles.timeSlot}
                onClick={() => handleDateClick(day)}
              >
                {/* Render events that start in this hour */}
                {weekEvents
                  .filter(event => {
                    const eventStart = moment(event.start);
                    const eventDay = moment(event.start).startOf('day');
                    const currentDay = moment(day).startOf('day');
                    
                    // Show event only in the hour it starts
                    return eventDay.isSame(currentDay) && eventStart.hour() === hour;
                  })
                  .map((event, eventIndex) => {
                    const spanInfo = getEventSpanInfo(event, day);
                    const totalHeight = spanInfo.totalHours * 60; // 60px per hour
                    const startOffset = spanInfo.startPosition * 0.6; // 0.6px per percentage
                    const endOffset = (100 - spanInfo.endPosition) * 0.6;
                    
                    return (
                      <div
                        key={`event-${event.id || eventIndex}-${moment(event.start).format('YYYY-MM-DD-HH-mm')}`}
                        className={styles.eventBlock}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        onMouseEnter={(e) => {
                          const baseColor = event.status === 'ACCEPTED' 
                            ? (userRole === 'worker' ? 'var(--primary-color)' : 'var(--success-color)')
                            : '#525252';
                          e.currentTarget.style.backgroundColor = baseColor === '#525252' ? '#4a4a4a' : 
                            (baseColor === 'var(--primary-color)' ? '#2563eb' : '#059669');
                          e.currentTarget.style.transform = 'scale(1.02)';
                          // Make text and icon more visible on hover
                          const icon = e.currentTarget.querySelector('svg');
                          const text = e.currentTarget.querySelector('span');
                          if (icon) icon.style.color = '#fff';
                          if (text) text.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          const baseColor = event.status === 'ACCEPTED' 
                            ? (userRole === 'worker' ? 'var(--primary-color)' : 'var(--success-color)')
                            : '#525252';
                          e.currentTarget.style.backgroundColor = baseColor;
                          e.currentTarget.style.transform = 'scale(1)';
                          // Reset text and icon color
                          const icon = e.currentTarget.querySelector('svg');
                          const text = e.currentTarget.querySelector('span');
                          if (icon) icon.style.color = '#888';
                          if (text) text.style.color = '#888';
                        }}
                        style={{
                          backgroundColor: event.status === 'ACCEPTED' 
                            ? (userRole === 'worker' ? 'var(--primary-color)' : 'var(--success-color)')
                            : '#525252',
                          height: `${Math.max(totalHeight - startOffset - endOffset, 20)}px`,
                          margin: '0',
                          borderRadius: '4px',
                          position: 'absolute',
                          top: `${startOffset}px`,
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
                          gap: '5px',
                          padding: '2px 6px',
                          flexDirection: 'column'
                        }}
                      >
                        <span style={{ fontSize: '2.5vw', color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Open gig</span>
                        <Eye size={25} color="#888" />
                      </div>
                    );
                  })}
                  
                  {/* Show placeholder when no events */}
                  {weekEvents.length === 0 && hour === 9 && moment(day).day() === 1 && (
                    <div
                      style={{
                        backgroundColor: '#3a3a3a',
                        height: '40px',
                        margin: '10px 0',
                        borderRadius: '4px',
                        position: 'absolute',
                        top: '10px',
                        left: '5px',
                        right: '5px',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        fontSize: '12px',
                        fontStyle: 'italic'
                      }}
                    >
                      No gigs scheduled this week
                    </div>
                  )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekViewCalendar; 