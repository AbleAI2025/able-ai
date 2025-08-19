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
    
    // Safety check: ensure availabilitySlots is an array
    if (!Array.isArray(availabilitySlots)) {
      console.warn('MonthlyAvailabilityView: availabilitySlots is not an array:', availabilitySlots);
      return [];
    }
    
    console.log('Slot details:', availabilitySlots.map(slot => ({
      id: slot.id,
      frequency: slot.frequency,
      days: slot.days,
      ends: slot.ends,
      occurrences: slot.occurrences,
      createdAt: slot.createdAt
    })));
    console.log('Raw slot data:', JSON.stringify(availabilitySlots, null, 2));
    
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
       const normalizedDayName = normalizeDayName(dayName);
       const normalizedSlotDays = slot.days.map(day => normalizeDayName(day));
       const dayMatches = normalizedSlotDays.includes(normalizedDayName);
       
       if (!dayMatches) {
         console.log('Recurring check - day not in slot:', { dayName, slotDays: slot.days, matches: false });
         return false;
       }
       
               // For bi-weekly, check if this date should be shown based on the pattern
        if (slot.frequency === 'biweekly') {
          // Find the first occurrence date to establish the pattern
          // Use the actual start date if provided, otherwise fall back to creation date
          const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                             slot.createdAt ? new Date(slot.createdAt) : new Date();
          slotStartDate.setHours(0, 0, 0, 0);
          
          // Find the first occurrence of any of our target days
          let firstOccurrenceDate: Date | null = null;
          let tempDate = new Date(slotStartDate);
          const checkDate = new Date(date);
          checkDate.setHours(0, 0, 0, 0);
          
          // Look for the first occurrence starting from the slot start date
          while (tempDate <= checkDate) {
            const tempDayName = getDayName(tempDate);
            const tempNormalizedDayName = normalizeDayName(tempDayName);
            if (normalizedSlotDays.includes(tempNormalizedDayName)) {
              firstOccurrenceDate = new Date(tempDate);
              break;
            }
            tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
          }
          
          if (firstOccurrenceDate) {
            // Calculate weeks since first occurrence (continuous across months)
            const daysSinceFirst = Math.floor((checkDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
            const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
            
            // Show only on even weeks (0, 2, 4, 6, etc.)
            const shouldShowThisWeek = weeksSinceFirst % 2 === 0;
            
            console.log('Bi-weekly display check:', { 
              date: date.toDateString(), 
              firstOccurrence: firstOccurrenceDate.toDateString(),
              weeksSinceFirst, 
              shouldShowThisWeek,
              daysSinceFirst
            });
            
            if (!shouldShowThisWeek) {
              console.log('Bi-weekly display - skipping week:', { date: date.toDateString(), weeksSinceFirst });
              return false;
            }
          } else {
            console.log('Bi-weekly display - no first occurrence found for date:', date.toDateString());
            return false;
          }
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
       
       // For weekly, check if this date should be shown based on the pattern
       if (slot.frequency === 'weekly') {
         // Find the first occurrence date to establish the pattern
         // Use the actual start date if provided, otherwise fall back to creation date
         const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                            slot.createdAt ? new Date(slot.createdAt) : new Date();
         slotStartDate.setHours(0, 0, 0, 0);
         
         // Find the first occurrence of any of our target days
         let firstOccurrenceDate: Date | null = null;
         let tempDate = new Date(slotStartDate);
         
         // Look for the first occurrence starting from the slot start date
         while (tempDate <= checkDate) {
           const tempDayName = getDayName(tempDate);
           const tempNormalizedDayName = normalizeDayName(tempDayName);
           if (normalizedSlotDays.includes(tempNormalizedDayName)) {
             firstOccurrenceDate = new Date(tempDate);
             break;
           }
           tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
         }
         
         if (firstOccurrenceDate) {
           // For weekly frequency, occurrences should be treated as weeks, not individual occurrences
           // Calculate how many weeks have passed since the first occurrence
           const daysSinceFirst = Math.floor((checkDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
           const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
           
           console.log('Weekly display check:', { 
             date: date.toDateString(), 
             firstOccurrence: firstOccurrenceDate.toDateString(),
             weeksSinceFirst
           });
           
           // If we have an occurrence limit, check if we've exceeded it (count by weeks)
           if (slot.occurrences && weeksSinceFirst >= slot.occurrences) {
             console.log('Weekly display - occurrence limit reached:', { weeksSinceFirst, maxOccurrences: slot.occurrences });
             return false;
           }
         } else {
           console.log('Weekly display - no first occurrence found for date:', date.toDateString());
           return false;
         }
       }
       
               // For monthly, check if this date should be shown based on the pattern
        if (slot.frequency === 'monthly') {
          // Find the first occurrence date to establish the pattern
          // Use the actual start date if provided, otherwise fall back to creation date
          const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                             slot.createdAt ? new Date(slot.createdAt) : new Date();
          slotStartDate.setHours(0, 0, 0, 0);
          
          // Find the first occurrence of any of our target days
          let firstOccurrenceDate: Date | null = null;
          let tempDate = new Date(slotStartDate);
          
          // Look for the first occurrence starting from the slot start date
          while (tempDate <= checkDate) {
            const tempDayName = getDayName(tempDate);
            const tempNormalizedDayName = normalizeDayName(tempDayName);
            if (normalizedSlotDays.includes(tempNormalizedDayName)) {
              firstOccurrenceDate = new Date(tempDate);
              break;
            }
            tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
          }
          
          if (firstOccurrenceDate) {
            // Calculate months since first occurrence
            const monthsSinceFirst = (checkDate.getFullYear() - firstOccurrenceDate.getFullYear()) * 12 + 
                                    (checkDate.getMonth() - firstOccurrenceDate.getMonth());
            
            console.log('Monthly display check:', { 
              date: date.toDateString(), 
              firstOccurrence: firstOccurrenceDate.toDateString(),
              monthsSinceFirst
            });
            
            // If we have an occurrence limit, check if we've exceeded it (count by months)
            if (slot.occurrences && monthsSinceFirst >= slot.occurrences) {
              console.log('Monthly display - occurrence limit reached:', { monthsSinceFirst, maxOccurrences: slot.occurrences });
              return false;
            }
            
            // For monthly, we need to check if this specific date should be shown
            // Check if the day of the week matches and if it's the correct month interval
            const firstOccurrenceDayOfWeek = firstOccurrenceDate.getDay();
            const currentDayOfWeek = checkDate.getDay();
            
            // Check if the day of the week matches
            if (firstOccurrenceDayOfWeek !== currentDayOfWeek) {
              console.log('Monthly display - day of week mismatch:', { 
                firstOccurrenceDayOfWeek, 
                currentDayOfWeek, 
                date: date.toDateString() 
              });
              return false;
            }
            
            // Check if this is the correct month interval (every month)
            if (monthsSinceFirst < 0) {
              console.log('Monthly display - date before first occurrence:', { monthsSinceFirst });
              return false;
            }
            
            // For monthly, we need to check if this specific date falls on the same week of the month
            // Calculate which week of the month the first occurrence was on
            const firstOccurrenceDayOfMonth = firstOccurrenceDate.getDate();
            const currentDayOfMonth = checkDate.getDate();
            const firstOccurrenceWeekOfMonth = Math.ceil(firstOccurrenceDayOfMonth / 7);
            const currentWeekOfMonth = Math.ceil(currentDayOfMonth / 7);
            
            // Check if this is the same week of the month
            if (firstOccurrenceWeekOfMonth !== currentWeekOfMonth) {
              console.log('Monthly display - week of month mismatch:', { 
                firstOccurrenceWeekOfMonth, 
                currentWeekOfMonth, 
                firstOccurrenceDayOfMonth: firstOccurrenceDate.getDate(),
                currentDayOfMonth: checkDate.getDate(),
                date: date.toDateString() 
              });
              return false;
            }
            
            console.log('Monthly display - valid date:', { 
              date: date.toDateString(), 
              monthsSinceFirst,
              dayOfWeek: currentDayOfWeek,
              dayOfMonth: currentDayOfMonth,
              weekOfMonth: currentWeekOfMonth
            });
          } else {
            console.log('Monthly display - no first occurrence found for date:', date.toDateString());
            return false;
          }
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
       console.log('Checking occurrence limit:', { 
         ends: slot.ends, 
         occurrences: slot.occurrences,
         endsType: typeof slot.ends,
         occurrencesType: typeof slot.occurrences,
         endsMatches: slot.ends === 'after_occurrences',
         occurrencesTruthy: !!slot.occurrences
       });
               // Check for occurrence limit - either 'after_occurrences' or 'never' with occurrences set
        if ((slot.ends === 'after_occurrences' || (slot.ends === 'never' && slot.occurrences)) && slot.occurrences) {
                     // For bi-weekly, calculate bi-weekly periods directly from the current date
           if (slot.frequency === 'biweekly') {
             // Find the first occurrence date to establish the pattern
             // Use the actual start date if provided, otherwise fall back to creation date
             const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                                slot.createdAt ? new Date(slot.createdAt) : new Date();
             slotStartDate.setHours(0, 0, 0, 0);
            
            // Find the first occurrence of any of our target days
            let firstOccurrenceDate: Date | null = null;
            let tempDate = new Date(slotStartDate);
            const checkDate = new Date(date);
            checkDate.setHours(0, 0, 0, 0);
            
            while (tempDate <= checkDate) {
              const tempDayName = getDayName(tempDate);
              const tempNormalizedDayName = normalizeDayName(tempDayName);
              const normalizedSlotDays = slot.days.map(day => normalizeDayName(day));
              if (normalizedSlotDays.includes(tempNormalizedDayName)) {
                firstOccurrenceDate = new Date(tempDate);
                break;
              }
              tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
            }
            
            if (firstOccurrenceDate) {
              // Calculate bi-weekly periods since first occurrence
              const daysSinceFirst = Math.floor((checkDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
              const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
              const biWeeklyPeriods = Math.floor(weeksSinceFirst / 2) + 1; // +1 because we count the first period
              
              console.log('Bi-weekly occurrence check:', { 
                date: date.toDateString(),
                firstOccurrence: firstOccurrenceDate.toDateString(),
                weeksSinceFirst, 
                biWeeklyPeriods,
                maxOccurrences: slot.occurrences, 
                shouldShow: biWeeklyPeriods <= slot.occurrences 
              });
              
              if (biWeeklyPeriods > slot.occurrences) {
                console.log('Bi-weekly occurrence limit reached:', { biWeeklyPeriods, maxOccurrences: slot.occurrences });
                return false;
              }
            }
                     }
           // Weekly and Monthly are handled in the display logic above
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
    
    // Start from the slot's startDate if provided, otherwise use createdAt
    const slotStartDate = slot.startDate ? new Date(slot.startDate) : 
                         slot.createdAt ? new Date(slot.createdAt) : new Date();
    slotStartDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);
    
    let count = 0;
    let currentDate = new Date(slotStartDate);
    
         // For biweekly, we need to find the first occurrence to establish the pattern
     let firstOccurrenceDate: Date | null = null;
     if (slot.frequency === 'biweekly') {
       console.log('Looking for first occurrence date...');
       // Find the first occurrence of any of our target days
       let tempDate = new Date(slotStartDate);
       while (tempDate <= endDate) {
         const dayName = getDayName(tempDate);
         const normalizedDayName = normalizeDayName(dayName);
         
         console.log(`Checking date ${tempDate.toDateString()}: dayName=${dayName}, normalized=${normalizedDayName}, in slot.days=${slot.days.includes(normalizedDayName)}`);
         
                   // Check if the normalized day name matches any of the slot days (after normalizing them too)
          const normalizedSlotDays = slot.days.map(day => normalizeDayName(day));
          if (normalizedSlotDays.includes(normalizedDayName)) {
            firstOccurrenceDate = new Date(tempDate);
            console.log(`Found first occurrence date: ${firstOccurrenceDate.toDateString()}`);
            break;
          }
         tempDate = new Date(tempDate.getTime() + 24 * 60 * 60 * 1000);
       }
       
       if (!firstOccurrenceDate) {
         console.log('No first occurrence date found!');
       }
     }
    
    while (currentDate <= endDate) {
      const dayName = getDayName(currentDate);
      const normalizedDayName = normalizeDayName(dayName);
      
             // Check if the normalized day name matches any of the slot days (after normalizing them too)
       const normalizedSlotDays = slot.days.map(day => normalizeDayName(day));
       if (normalizedSlotDays.includes(normalizedDayName)) {
        let shouldCount = false;
        
        if (slot.frequency === 'weekly') {
          // Weekly: count every occurrence
          shouldCount = true;
                 } else if (slot.frequency === 'biweekly') {
           // Biweekly: count only every other week
           if (firstOccurrenceDate) {
             const daysSinceFirst = Math.floor((currentDate.getTime() - firstOccurrenceDate.getTime()) / (24 * 60 * 60 * 1000));
             const weeksSinceFirst = Math.floor(daysSinceFirst / 7);
             // Count events only on even weeks (0, 2, 4, 6, etc.)
             shouldCount = weeksSinceFirst % 2 === 0;
             console.log(`Biweekly counting: date=${currentDate.toDateString()}, weeksSinceFirst=${weeksSinceFirst}, shouldCount=${shouldCount}`);
           }
        } else if (slot.frequency === 'monthly') {
          // Monthly: count only once per month per day
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          
          // Check if we've already counted an event for this month and day
          let alreadyCountedThisMonth = false;
          let checkDate = new Date(slotStartDate);
          while (checkDate < currentDate) {
            const checkDayName = getDayName(checkDate);
            const checkNormalizedDayName = normalizeDayName(checkDayName);
            const checkMonth = checkDate.getMonth();
            const checkYear = checkDate.getFullYear();
            
            if (checkNormalizedDayName === normalizedDayName && 
                checkMonth === currentMonth && 
                checkYear === currentYear) {
              alreadyCountedThisMonth = true;
              break;
            }
            checkDate = new Date(checkDate.getTime() + 24 * 60 * 60 * 1000);
          }
          
          shouldCount = !alreadyCountedThisMonth;
        }
        
        if (shouldCount) {
          count++;
        }
      }
      
             currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
     }
     
     console.log(`Final count for ${slot.frequency}: ${count}`);
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
