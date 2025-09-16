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
  // events,
  availabilitySlots,
  // currentDate,
  // onEventClick,
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

  // Time slots from 6 AM to 11 PM (18 hours total) - matching accepted gigs design
  const hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM to 11 PM

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
    // Safety check: ensure availabilitySlots is an array
    if (!Array.isArray(availabilitySlots)) {
      console.warn('DailyAvailabilityView: availabilitySlots is not an array:', availabilitySlots);
      return [];
    }
    
    return availabilitySlots.filter(slot => {
      // Handle single occurrences
      if (slot.frequency === 'never' && slot.endDate) {
        const slotDate = new Date(slot.endDate);
        return slotDate.toDateString() === date.toDateString();
      }
      
      // Handle recurring slots
      const dayName = getDayName(date);
      
      if (!slot.days.includes(dayName)) {
        return false;
      }
      
      // Check if the date is within the valid range for this recurring slot
      const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                           slot.createdAt ? new Date(slot.createdAt) : new Date();
      slotStartDate.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Don't show recurring slots for dates before the slot's start date
      if (checkDate < slotStartDate) {
        return false;
      }
      
      // Check end date if specified
      if (slot.ends === 'on_date' && slot.endDate) {
        const endDate = new Date(slot.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        if (checkDate > endDate) {
          return false;
        }
      }
      
      // Check occurrence count if specified
      if (slot.ends === 'after_occurrences' && slot.occurrences) {
        // For weekly frequency, count by weeks, not individual occurrences
        if (slot.frequency === 'weekly') {
          // Find the first occurrence date to establish the pattern
          const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                             slot.createdAt ? new Date(slot.createdAt) : new Date();
          slotStartDate.setHours(0, 0, 0, 0);
          
          // Find the first occurrence of any of our target days
          let firstOccurrenceDate: Date | null = null;
          let tempDate = new Date(slotStartDate);
          
          while (tempDate <= checkDate) {
            const tempDayName = getDayName(tempDate);
            const normalizedTempDayName = normalizeDayName(tempDayName);
            const normalizedSlotDays = slot.days.map(day => normalizeDayName(day));
            
            if (normalizedSlotDays.includes(normalizedTempDayName)) {
              firstOccurrenceDate = new Date(tempDate);
              break;
            }
            tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
          }
          
          if (firstOccurrenceDate) {
            // Calculate weeks since first occurrence
            const daysSinceFirst = Math.floor((checkDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
            const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
            
            // If we have an occurrence limit, check if we've exceeded it (count by weeks)
            if (weeksSinceFirst >= slot.occurrences) {
              return false;
            }
          }
        } else {
          // For other frequencies, use the old logic
          const occurrenceCount = getOccurrenceCountForSlot(slot, date);
          if (occurrenceCount >= slot.occurrences) {
            return false;
          }
        }
      }
      
      return true;
    });
  };

  // Helper function to count occurrences up to a specific date
  const getOccurrenceCountForSlot = (slot: AvailabilitySlot, targetDate: Date): number => {
    if (slot.frequency === 'never') return 0;
    
    // Start from the slot's startDate if provided, otherwise use createdAt
    const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                         slot.createdAt ? new Date(slot.createdAt) : new Date();
    slotStartDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    let count = 0;
    let currentDate = new Date(slotStartDate);
    
    while (currentDate <= endDate) {
      const dayName = getDayName(currentDate);
      const normalizedDayName = normalizeDayName(dayName);
      
      if (slot.days.includes(normalizedDayName)) {
        count++;
      }
      
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    }
    
    return count;
  };

  const normalizeDayName = (dayName: string): string => {
    const dayMap: { [key: string]: string } = {
      'Mon': 'monday',
      'Tue': 'tuesday', 
      'Wed': 'wednesday',
      'Thu': 'thursday',
      'Fri': 'friday',
      'Sat': 'saturday',
      'Sun': 'sunday',
      'monday': 'monday',
      'tuesday': 'tuesday',
      'wednesday': 'wednesday', 
      'thursday': 'thursday',
      'friday': 'friday',
      'saturday': 'saturday',
      'sunday': 'sunday'
    };
    return dayMap[dayName] || dayName;
  };

  const getTimePosition = (time: string) => {
    const [hour] = time.split(':').map(Number);
    return ((hour - 6) / 18) * 100; // 18 hours from 6 AM to 11 PM
  };

  const getTimeHeight = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = endMinutes - startMinutes;
    return (duration / 60) * (100 / 18); // Convert to percentage of 18 hours
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
        onAvailabilityEdit(showContextMenu.slot);
        break;
      case 'repeat':
        onAvailabilityEdit(showContextMenu.slot);
        break;
      case 'delete':
        onAvailabilityDelete(showContextMenu.slot);
        break;
    }
    setShowContextMenu(null);
  };

  const handleEmptySlotClick = (hour: number) => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hour, 0, 0, 0);
    
    const timeString = `${hour.toString().padStart(2, '0')}:00`;
    onDateSelect(newDate, timeString);
  };

  const dayAvailability = getAvailabilityForDay(selectedDate);

  return (
    <div className={styles.container}>
      {/* Header - similar to accepted gigs design */}
      <div className={styles.header}>
        <div className={styles.timeHeader}>
          <span>TIME</span>
        </div>
        <div className={styles.dayHeader}>
          <div className={styles.dayName}>{getDayName(selectedDate)}</div>
          <div className={styles.dayNumber}>{getFormattedDate(selectedDate)}</div>
        </div>
      </div>

      {/* Time Grid - similar to accepted gigs design */}
      <div className={styles.timeGrid}>
        <div className={styles.timeColumn}>
          {hours.map((hour) => (
            <div key={hour} className={styles.timeLabel}>
              {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
            </div>
          ))}
        </div>

        <div className={styles.availabilityColumn}>
          {hours.map((hour, hourIndex) => {
            const relevantSlot = dayAvailability.find(slot => {
              const slotStart = parseInt(slot.startTime.split(':')[0]);
              const slotEnd = parseInt(slot.endTime.split(':')[0]);
              return hour >= slotStart && hour < slotEnd;
            });

            if (relevantSlot) {
              const isFirstHour = hour === parseInt(relevantSlot.startTime.split(':')[0]);
              if (isFirstHour) {
                const height = getTimeHeight(relevantSlot.startTime, relevantSlot.endTime);
                return (
                  <div
                    key={hourIndex}
                    className={styles.availabilityBlock}
                    style={{
                      top: `${getTimePosition(relevantSlot.startTime)}%`,
                      height: `${height}%`,
                    }}
                    onClick={(e) => handleAvailabilityClick(e, relevantSlot)}
                  >
                    <div className={styles.availabilityContent}>
                      <div className={styles.availabilityTime}>
                        {relevantSlot.startTime} - {relevantSlot.endTime}
                      </div>
                      <div className={styles.availabilityStatus}>
                        Available
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }

            return (
              <div
                key={hourIndex}
                className={styles.emptySlot}
                onClick={() => handleEmptySlotClick(hour)}
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
