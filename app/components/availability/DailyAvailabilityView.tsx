"use client";

import React, { useState } from "react";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { AvailabilitySlot } from "@/app/types/AvailabilityTypes";
import styles from "./DailyAvailabilityView.module.css";

interface DailyAvailabilityViewProps {
  events: CalendarEvent[];
  availabilitySlots: AvailabilitySlot[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDateSelect: (date: Date, selectedTime?: string) => void;
  onAvailabilityEdit: (slot: AvailabilitySlot) => void;
  onAvailabilityDelete: (slot: AvailabilitySlot) => void;
  onClearAll: () => void;
  selectedDate: Date;
}

const DailyAvailabilityView: React.FC<DailyAvailabilityViewProps> = ({
  events,
  availabilitySlots,
  currentDate,
  onEventClick,
  onDateSelect,
  onAvailabilityEdit,
  onAvailabilityDelete,
  onClearAll,
  selectedDate,
}) => {
  const [showContextMenu, setShowContextMenu] = useState<{
    x: number;
    y: number;
    slot: AvailabilitySlot;
  } | null>(null);

  // Time slots from 9 AM to 10 PM
  const timeSlots: string[] = [];
  for (let hour = 9; hour <= 22; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  const getDayName = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
  };

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getAvailabilityForDay = (date: Date): AvailabilitySlot[] => {
    const dayName = getDayName(date);
    return availabilitySlots.filter(slot => slot.days.includes(dayName));
  };

  const getTimePosition = (time: string) => {
    const [hour] = time.split(':').map(Number);
    return ((hour - 9) / 13) * 100; // 13 hours from 9 AM to 10 PM
  };

  const getTimeHeight = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    return (duration / 60) * (100 / 13); // Convert to percentage of 13 hours
  };

  const handleAvailabilityClick = (event: React.MouseEvent, slot: AvailabilitySlot) => {
    event.preventDefault();
    setShowContextMenu({
      x: event.clientX,
      y: event.clientY,
      slot,
    });
  };

  const handleContextMenuAction = (action: 'edit' | 'repeat' | 'delete') => {
    if (!showContextMenu) return;

    switch (action) {
      case 'edit':
        // For daily view, we're already on a single day, so edit the slot as-is
        onAvailabilityEdit(showContextMenu.slot);
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

  const handleEmptySlotClick = (time: string) => {
    const [hour] = time.split(':').map(Number);
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, 0, 0, 0);
    
    // Pass the selected time as a hint for the start time
    onDateSelect(newDate, time);
  };

  const dayAvailability = getAvailabilityForDay(selectedDate);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          {getDayName(selectedDate)} {getFormattedDate(selectedDate)}
        </h2>
      </div>

      {/* Time slots and availability blocks */}
      <div className={styles.timeGrid}>
        <div className={styles.timeColumn}>
          {timeSlots.map((time) => (
            <div key={time} className={styles.timeSlot}>
              {time}
            </div>
          ))}
        </div>

        <div className={styles.availabilityColumn}>
          {timeSlots.map((time, timeIndex) => {
            const relevantSlot = dayAvailability.find(slot => {
              const slotStart = slot.startTime;
              const slotEnd = slot.endTime;
              return time >= slotStart && time < slotEnd;
            });

            if (relevantSlot) {
              const isFirstTimeSlot = time === relevantSlot.startTime;
              if (isFirstTimeSlot) {
                const height = getTimeHeight(relevantSlot.startTime, relevantSlot.endTime);
                return (
                  <div
                    key={timeIndex}
                    className={styles.availabilityBlock}
                    style={{
                      top: `${getTimePosition(relevantSlot.startTime)}%`,
                      height: `${height}%`,
                    }}
                    onClick={(e) => handleAvailabilityClick(e, relevantSlot)}
                  />
                );
              }
              return null; // Don't render for subsequent time slots of the same availability
            }

            return (
              <div
                key={timeIndex}
                className={styles.emptySlot}
                onClick={() => handleEmptySlotClick(time)}
              />
            );
          })}
        </div>
      </div>

             {/* Context Menu */}
       {showContextMenu && (
         <div className={styles.contextMenu} style={{ left: showContextMenu.x, top: showContextMenu.y }}>
           <button onClick={() => handleContextMenuAction('edit')}>Edit This Day</button>
           <button onClick={() => handleContextMenuAction('repeat')}>Edit Recurring</button>
           <button onClick={() => handleContextMenuAction('delete')} className={styles.deleteOption}>
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

export default DailyAvailabilityView;
