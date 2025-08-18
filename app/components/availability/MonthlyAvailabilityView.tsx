"use client";

import React, { useState } from "react";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { AvailabilitySlot } from "@/app/types/AvailabilityTypes";
import styles from "./MonthlyAvailabilityView.module.css";

interface MonthlyAvailabilityViewProps {
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

const MonthlyAvailabilityView: React.FC<MonthlyAvailabilityViewProps> = ({
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
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);

  const getMonthDates = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const dates: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || dates.length < 42) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const getDayName = (date: Date) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[date.getDay()];
  };

  const getAvailabilityForDay = (date: Date): AvailabilitySlot[] => {
    console.log('getAvailabilityForDay called for date:', date.toDateString());
    console.log('Available slots:', availabilitySlots);
    
    const result = availabilitySlots.filter(slot => {
      // Handle single occurrences
      if (slot.frequency === 'never' && slot.endDate) {
        const slotDate = new Date(slot.endDate);
        const matches = slotDate.toDateString() === date.toDateString();
        console.log('Single occurrence check:', { slotDate: slotDate.toDateString(), date: date.toDateString(), matches });
        return matches;
      }
      
      // Handle recurring slots
      const dayName = getDayName(date);
      const dayMatches = slot.days.includes(dayName);
      
      if (!dayMatches) {
        console.log('Recurring check - day not in slot:', { dayName, slotDays: slot.days, matches: false });
        return false;
      }
      
      // Check if the date is within the valid range for this recurring slot
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // Don't show recurring slots for past dates
      if (checkDate < today) {
        console.log('Recurring check - date in past:', { date: checkDate.toDateString(), today: today.toDateString(), matches: false });
        return false;
      }
      
      // Check end date if specified
      if (slot.ends === 'on_date' && slot.endDate) {
        const endDate = new Date(slot.endDate);
        endDate.setHours(23, 59, 59, 999); // End of the day
        if (checkDate > endDate) {
          console.log('Recurring check - date after end date:', { date: checkDate.toDateString(), endDate: endDate.toDateString(), matches: false });
          return false;
        }
      }
      
      // Check occurrence count if specified
      if (slot.ends === 'after_occurrences' && slot.occurrences) {
        const occurrenceCount = getOccurrenceCountForSlot(slot, date);
        if (occurrenceCount >= slot.occurrences) {
          console.log('Recurring check - max occurrences reached:', { occurrenceCount, maxOccurrences: slot.occurrences, matches: false });
          return false;
        }
      }
      
      console.log('Recurring check - valid:', { dayName, slotDays: slot.days, matches: true });
      return true;
    });
    
    console.log('Result for date', date.toDateString(), ':', result);
    return result;
  };

  // Helper function to count occurrences up to a specific date
  const getOccurrenceCountForSlot = (slot: AvailabilitySlot, targetDate: Date): number => {
    if (slot.frequency === 'never') return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(Math.max(today.getTime(), new Date(slot.createdAt).getTime()));
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    let count = 0;
    let currentDate = new Date(startDate);
    
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

  const hasAvailability = (date: Date): boolean => {
    return getAvailabilityForDay(date).length > 0;
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentMonth.getMonth() && 
           date.getFullYear() === currentMonth.getFullYear();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const handleDateClick = (date: Date) => {
    // Pass the selected date to the parent component
    onDateSelect(date);
  };

  const handlePreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const monthDates = getMonthDates(currentMonth);
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.monthInfo}>
          <h2 className={styles.monthTitle}>{getMonthName(currentMonth)}</h2>
        </div>
        <button className={styles.chooseDateButton} onClick={() => onDateSelect(selectedDate)}>
          Choose a date
        </button>
      </div>

      {/* Calendar Grid */}
      <div className={styles.calendarGrid}>
        {/* Day Headers */}
        <div className={styles.dayHeaders}>
          {dayHeaders.map((day) => (
            <div key={day} className={styles.dayHeader}>
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={styles.daysGrid}>
          {monthDates.map((date, index) => (
            <button
              key={index}
              className={`${styles.dayCell} ${
                !isCurrentMonth(date) ? styles.otherMonth : ''
              } ${isToday(date) ? styles.today : ''} ${
                isSelected(date) ? styles.selected : ''
              } ${hasAvailability(date) ? styles.hasAvailability : ''}`}
              onClick={() => handleDateClick(date)}
            >
              <span className={styles.dayNumber}>{date.getDate()}</span>
              {hasAvailability(date) && (
                <div className={styles.availabilityIndicator} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <button className={styles.navButton} onClick={handlePreviousMonth}>
          ‹
        </button>
        <button className={styles.navButton} onClick={handleNextMonth}>
          ›
        </button>
      </div>

      {/* Clear button */}
      <button className={styles.clearButton} onClick={onClearAll} title="Clear all availability">
        🗑️
      </button>
    </div>
  );
};

export default MonthlyAvailabilityView;
