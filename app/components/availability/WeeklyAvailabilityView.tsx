"use client";

import React, { useState } from 'react';
import moment from 'moment';
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { AvailabilitySlot } from "@/app/types/AvailabilityTypes";
import styles from './WeeklyAvailabilityView.module.css';

interface WeeklyAvailabilityViewProps {
  events: CalendarEvent[];
  availabilitySlots: AvailabilitySlot[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date, selectedTime?: string) => void;
  onAvailabilityEdit: (slot: AvailabilitySlot) => void;
  onAvailabilityDelete: (slot: AvailabilitySlot) => void;
  onClearAll: () => void;
}

const WeeklyAvailabilityView: React.FC<WeeklyAvailabilityViewProps> = ({
  events,
  availabilitySlots,
  currentDate,
  onEventClick,
  onDateSelect,
  onAvailabilityEdit,
  onAvailabilityDelete,
  onClearAll,
}) => {
  const [showContextMenu, setShowContextMenu] = useState<{
    x: number;
    y: number;
    slot: AvailabilitySlot;
    clickedDay: Date;
  } | null>(null);

  // Close context menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showContextMenu) {
        setShowContextMenu(null);
      }
    };

    if (showContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showContextMenu]);

  // Get the start of the week (Monday) based on the current date
  const startOfWeek = moment(currentDate).startOf('isoWeek');
  
  // Generate array of 7 days
  const weekDays = Array.from({ length: 7 }, (_, i) => 
    moment(startOfWeek).add(i, 'days').toDate()
  );

  // Generate array of hours from 6 AM to 11 PM (18 hours total) - matching WeekViewCalendar
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);

  // Get availability for the current week
  const getAvailabilityForDay = (date: Date): AvailabilitySlot[] => {
    const dayName = moment(date).format('ddd');
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayIndex = moment(date).isoWeekday() - 1; // Monday = 1, so subtract 1 for array index
    const dayNameShort = dayNames[dayIndex];
    return availabilitySlots.filter(slot => slot.days.includes(dayNameShort));
  };

  const handleDateClick = (date: Date) => {
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleAvailabilityClick = (event: React.MouseEvent, slot: AvailabilitySlot, clickedDay: Date) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Context menu dimensions (approximate)
    const menuWidth = 120;
    const menuHeight = 120;
    
    // Calculate position to keep menu on screen
    let x = event.clientX;
    let y = event.clientY;
    
    // Adjust horizontal position if menu would go off-screen
    if (x + menuWidth > viewportWidth) {
      x = viewportWidth - menuWidth - 10;
    }
    
    // Adjust vertical position if menu would go off-screen
    if (y + menuHeight > viewportHeight) {
      y = viewportHeight - menuHeight - 10;
    }
    
    // Ensure minimum position
    x = Math.max(10, x);
    y = Math.max(10, y);
    
    setShowContextMenu({
      x,
      y,
      slot,
      clickedDay,
    });
  };

  const handleContextMenuAction = (action: 'edit' | 'repeat' | 'delete') => {
    if (!showContextMenu) return;

    switch (action) {
      case 'edit':
        // For editing, we need to create a single-day slot for the specific day clicked
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dayIndex = moment(showContextMenu.clickedDay).isoWeekday() - 1;
        const dayName = dayNames[dayIndex];
        
                 // Create a single-day slot for editing
         const singleDaySlot: AvailabilitySlot = {
           ...showContextMenu.slot,
           days: [dayName], // Only the specific day
           frequency: 'never',
           ends: 'never'
         };
        onAvailabilityEdit(singleDaySlot);
        break;
      case 'repeat':
        // Handle repeat action - edit the full recurring slot
        onAvailabilityEdit(showContextMenu.slot);
        break;
      case 'delete':
        onAvailabilityDelete(showContextMenu.slot);
        break;
    }
    setShowContextMenu(null);
  };

  const handleEmptySlotClick = (date: Date, hour: number) => {
    const time = `${hour.toString().padStart(2, '0')}:00`;
    const newDate = new Date(date);
    newDate.setHours(hour, 0, 0, 0);
    onDateSelect(newDate, time);
  };

  const getAvailabilityForTimeSlot = (day: Date, hour: number) => {
    const dayAvailability = getAvailabilityForDay(day);
    return dayAvailability.filter(slot => {
      const slotStart = parseInt(slot.startTime.split(':')[0]);
      const slotEnd = parseInt(slot.endTime.split(':')[0]);
      return hour >= slotStart && hour < slotEnd;
    });
  };

  const getAvailabilitySpanInfo = (slot: AvailabilitySlot, day: Date) => {
    const slotStart = parseInt(slot.startTime.split(':')[0]);
    const slotEnd = parseInt(slot.endTime.split(':')[0]);
    
    // Calculate which hours this availability spans
    const startHour = slotStart;
    const endHour = slotEnd;
    
    // Calculate the start position within the first hour
    const startMinutes = parseInt(slot.startTime.split(':')[1]);
    const startPosition = (startMinutes / 60) * 100;
    
    // Calculate the end position within the last hour
    const endMinutes = parseInt(slot.endTime.split(':')[1]);
    const endPosition = (endMinutes / 60) * 100;
    
    return {
      startHour,
      endHour,
      startPosition,
      endPosition,
      totalHours: endHour - startHour + 1
    };
  };

  const getAvailabilityDisplayInfo = (slot: AvailabilitySlot, day: Date, hour: number) => {
    const slotStart = parseInt(slot.startTime.split(':')[0]);
    const slotEnd = parseInt(slot.endTime.split(':')[0]);
    
    // Check if this availability starts in this hour
    const isAvailabilityStart = slotStart === hour;
    
    // Calculate the top position for availability that starts within this hour
    let topPosition = 0;
    if (isAvailabilityStart) {
      const startMinutes = parseInt(slot.startTime.split(':')[1]);
      topPosition = (startMinutes / 60) * 100; // Convert to percentage
    }
    
    // Calculate the height for availability that ends within this hour
    let height = 100;
    if (slotEnd === hour + 1) {
      const endMinutes = parseInt(slot.endTime.split(':')[1]);
      height = (endMinutes / 60) * 100; // Convert to percentage
    }
    
    return {
      isStart: isAvailabilityStart,
      topPosition,
      height
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
            {weekDays.map((day) => {
              const dayAvailability = getAvailabilityForTimeSlot(day, hour);
              
              return (
                <div 
                  key={`slot-${moment(day).format('YYYY-MM-DD')}-${hour}`} 
                  className={styles.timeSlot}
                  onClick={() => handleEmptySlotClick(day, hour)}
                >
                                     {/* Render availability that starts in this hour */}
                   {dayAvailability
                     .filter(slot => {
                       const slotStart = parseInt(slot.startTime.split(':')[0]);
                       return slotStart === hour;
                     })
                     .map((slot, slotIndex) => {
                       const spanInfo = getAvailabilitySpanInfo(slot, day);
                       const totalHeight = spanInfo.totalHours * 60; // 60px per hour
                       const startOffset = spanInfo.startPosition * 0.6; // 0.6px per percentage
                       const endOffset = (100 - spanInfo.endPosition) * 0.6;
                       
                       return (
                         <div
                           key={`availability-${slotIndex}-${moment(day).format('YYYY-MM-DD-HH-mm')}`}
                           className={styles.availabilityBlock}
                           onClick={(e) => handleAvailabilityClick(e, slot, day)}
                           style={{
                             backgroundColor: '#10b981',
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
                           onMouseEnter={(e) => {
                             e.currentTarget.style.backgroundColor = '#059669';
                             e.currentTarget.style.transform = 'scale(1.02)';
                             e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                           }}
                           onMouseLeave={(e) => {
                             e.currentTarget.style.backgroundColor = '#10b981';
                             e.currentTarget.style.transform = 'scale(1)';
                             e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                           }}
                         >
                           <span style={{ 
                             fontSize: '2.5vw', 
                             color: '#ffffff', 
                             fontWeight: '600', 
                             whiteSpace: 'nowrap' 
                           }}>Available</span>
                         </div>
                       );
                     })}
                </div>
              );
            })}
          </div>
        ))}
      </div>

             {/* Context Menu */}
       {showContextMenu && (
         <div 
           className={styles.contextMenu} 
           style={{ 
             position: 'fixed',
             left: showContextMenu.x, 
             top: showContextMenu.y,
             zIndex: 1000,
             backgroundColor: '#ffffff',
             border: '1px solid #e5e7eb',
             borderRadius: '8px',
             boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
             padding: '8px 0',
             minWidth: '120px'
           }}
           onClick={(e) => e.stopPropagation()}
         >
                       <button 
              onClick={() => handleContextMenuAction('edit')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Edit This Day
            </button>
            <button 
              onClick={() => handleContextMenuAction('repeat')}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                color: '#374151',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Edit Recurring
            </button>
           <button 
             onClick={() => handleContextMenuAction('delete')}
             style={{
               display: 'block',
               width: '100%',
               padding: '8px 16px',
               border: 'none',
               background: 'none',
               textAlign: 'left',
               cursor: 'pointer',
               fontSize: '14px',
               color: '#ef4444',
               transition: 'background-color 0.2s'
             }}
             onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
             onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
           >
             Delete
           </button>
         </div>
       )}

      {/* Clear button */}
      <button className={styles.clearButton} onClick={onClearAll} title="Clear all availability">
        🗑️
      </button>
    </div>
  );
};

export default WeeklyAvailabilityView;

