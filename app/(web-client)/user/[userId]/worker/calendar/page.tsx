"use client";

// Worker Calendar Page Component
import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import AppCalendar from "@/app/components/shared/AppCalendar";
import CalendarHeader from "@/app/components/shared/CalendarHeader";
import CalendarEventComponent from "@/app/components/shared/CalendarEventComponent";
import EventDetailModal from "@/app/components/shared/EventDetailModal";
import { View } from "react-big-calendar";
import { useAuth } from "@/context/AuthContext";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { getCalendarEvents } from "@/actions/events/get-calendar-events";
import { getWorkerAvailability } from "@/actions/availability/manage-availability";
import { convertAvailabilitySlotsToEvents } from "@/app/utils/availabilityUtils";
import { AvailabilitySlot } from "@/app/types/AvailabilityTypes";
import NewAvailabilityModal from "@/app/components/availability/NewAvailabilityModal";
import ClearAvailabilityAlert from "@/app/components/availability/ClearAvailabilityAlert";
import WeeklyAvailabilityView from "@/app/components/availability/WeeklyAvailabilityView";
import DailyAvailabilityView from "@/app/components/availability/DailyAvailabilityView";
import MonthlyAvailabilityView from "@/app/components/availability/MonthlyAvailabilityView";
// Import the CSS module for this page
import styles from "./WorkerCalendarPage.module.css";
import Image from "next/image";

const FILTERS = ["Manage availability", "Accepted gigs", "See gig offers"];

// Helper to filter events based on active filter
function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  switch (filter) {
    case 'Manage availability':
      return events.filter(e => e.status === 'AVAILABLE');
    case 'Accepted gigs':
      return events.filter(e => e.status === 'ACCEPTED');
    case 'See gig offers':
      return events.filter(e => e.status === 'OFFER');
    default:
      return events;
  }
}

const WorkerCalendarPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "week";
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[2]); // Default to "See gig offers"
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
  const [selectedAvailabilitySlot, setSelectedAvailabilitySlot] = useState<AvailabilitySlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (!user) {
      router.push(`/signin?redirect=${pathname}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push(`/signin?error=unauthorized`);
      return;
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth]);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) {
        return;
      }

      try {
        // Fetch calendar events
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        if (calendarRes.error) {
          throw new Error(calendarRes.error);
        }

        // Fetch availability slots
        const availabilityRes = await getWorkerAvailability(user.uid);
        if (availabilityRes.error) {
          console.error('Error fetching availability:', availabilityRes.error);
        }

        const calendarData: CalendarEvent[] = calendarRes.events;
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        // Convert availability slots to events
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        // Combine all events
        const allEventsCombined = [...parsed, ...availabilityEvents];
        
        setAllEvents(allEventsCombined);
        setAvailabilitySlots(availabilityRes.availability || []);
        
        const filteredEvents = filterEvents(allEventsCombined, activeFilter);
        setEvents(filteredEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeFilter, date]);



  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Handle event clicks - different behavior for offers vs accepted gigs
  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'AVAILABLE') {
      // For availability events, show availability edit modal
      const slot = availabilitySlots.find(s => s.id === event.originalSlotId);
      setSelectedAvailabilitySlot(slot || null);
      setIsAvailabilityModalOpen(true);
    } else if (event.status === 'OFFER') {
      // For offers, show modal instead of navigating to gig details
      // (since offers aren't assigned to workers yet)
      setSelectedEvent(event);
      setIsModalOpen(true);
    } else {
      // For other events, show modal
      setSelectedEvent(event);
      setIsModalOpen(true);
    }
  };

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

  // When filter changes, update events with smooth transition
  const handleFilterChange = (filter: string) => {
    setIsFilterTransitioning(true);
    
    // Add a small delay to show the transition
    setTimeout(() => {
      setActiveFilter(filter);
      setEvents(filterEvents(allEvents, filter));
      setIsFilterTransitioning(false);
    }, 150);
  };

  // Handle view changes with smooth transition
  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  // Handle availability management
  const handleAvailabilitySave = async (data: any) => {
    if (!user) return;

    try {
      if (selectedAvailabilitySlot) {
        // Update existing slot
        const { updateAvailabilitySlot } = await import('@/actions/availability/manage-availability');
        await updateAvailabilitySlot(user.uid, selectedAvailabilitySlot.id, data);
      } else {
        // Create new slot
        const { createAvailabilitySlot } = await import('@/actions/availability/manage-availability');
        await createAvailabilitySlot(user.uid, data);
      }
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        setAvailabilitySlots(availabilityRes.availability || []);
        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
    } catch (error) {
      console.error('Error saving availability:', error);
    }
  };

  const handleAvailabilityDelete = async () => {
    if (!user || !selectedAvailabilitySlot) return;

    try {
      const { deleteAvailabilitySlot } = await import('@/actions/availability/manage-availability');
      await deleteAvailabilitySlot(user.uid, selectedAvailabilitySlot.id);
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        setAvailabilitySlots(availabilityRes.availability || []);
        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
    } catch (error) {
      console.error('Error deleting availability:', error);
    }
  };

  const handleAvailabilityModalClose = () => {
    setIsAvailabilityModalOpen(false);
    setSelectedAvailabilitySlot(null);
    setSelectedDate(null);
  };

  const handleDateSelect = (slotInfo: { start: Date; end: Date; slots: Date[] } | Date, selectedTime?: string) => {
    if (selectedTime) {
      // Handle availability view date selection with time
      setSelectedDate(slotInfo as Date);
      setSelectedTime(selectedTime);
      setIsAvailabilityModalOpen(true);
    } else {
      // Handle regular calendar date selection
      const slotInfoTyped = slotInfo as { start: Date; end: Date; slots: Date[] };
      setSelectedDate(slotInfoTyped.start);
      setSelectedTime(null);
      setIsAvailabilityModalOpen(true);
    }
  };

  const handleClearAllAvailability = async () => {
    if (!user) return;
    try {
      const { clearAllAvailability } = await import('@/actions/availability/manage-availability');
      await clearAllAvailability(user.uid);
      
      // Refresh events
      const fetchEvents = async () => {
        const calendarRes = await getCalendarEvents({ userId: user.uid, role: 'worker', isViewQA: false });
        const availabilityRes = await getWorkerAvailability(user.uid);
        
        const calendarData: CalendarEvent[] = calendarRes.events || [];
        const parsed = calendarData.map((event: CalendarEvent) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
        
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );

        const allEventsCombined = [...parsed, ...availabilityEvents];
        setAllEvents(allEventsCombined);
        setAvailabilitySlots(availabilityRes.availability || []);
        setEvents(filterEvents(allEventsCombined, activeFilter));
      };
      
      fetchEvents();
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing availability:', error);
    }
  };

  const handleAvailabilityEdit = (slot: AvailabilitySlot) => {
    setSelectedAvailabilitySlot(slot);
    setIsAvailabilityModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <CalendarHeader
        date={date}
        view={view}
        role="worker"
        onViewChange={handleViewChange}
        onNavigate={handleNavigate}
        filters={FILTERS}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        onDateSelect={activeFilter === 'Manage availability' ? (date) => handleDateSelect({ start: date, end: date, slots: [date] }) : undefined}
      />
      
      <main className={`${styles.mainContent} ${isFilterTransitioning ? styles.filterTransitioning : ''}`}>
        {activeFilter === 'Manage availability' ? (
          <>
            {/* Availability Views based on existing calendar view */}
            {view === 'day' && (
              <DailyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
                selectedDate={date}
              />
            )}
            {view === 'week' && (
              <WeeklyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
              />
            )}
            {view === 'month' && (
              <MonthlyAvailabilityView
                events={events}
                availabilitySlots={availabilitySlots}
                currentDate={date}
                onEventClick={handleEventClick}
                onDateSelect={handleDateSelect}
                onAvailabilityEdit={handleAvailabilityEdit}
                onAvailabilityDelete={handleAvailabilityDelete}
                onClearAll={() => setShowClearModal(true)}
                selectedDate={date}
              />
            )}
          </>
        ) : (
          <AppCalendar
            date={date}
            events={events}
            view={view}
            onView={setView}
            onNavigate={setDate}
            onSelectEvent={handleEventClick}
            onSelectSlot={handleDateSelect}
            userRole="worker"
            activeFilter={activeFilter}
            components={{
              event: (props: any) => (
                <CalendarEventComponent {...props} userRole="worker" view={view} activeFilter={activeFilter} />
              )
            }}
            hideToolbar={true}
          />
        )}
      </main>
      <footer className={styles.footer}>
        <button className={styles.homeButton} onClick={() => router.push(`/user/${pageUserId}/worker`)}>
          <Image src="/images/home.svg" alt="Home" width={24} height={24} />
        </button>
        <button className={styles.dashboardButton} onClick={() => router.push(`/user/${pageUserId}/worker`)}>
          Home
        </button>
      </footer>

      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        userRole="worker"
      />

      <NewAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={handleAvailabilityModalClose}
        slot={selectedAvailabilitySlot}
        onSave={handleAvailabilitySave}
        onDelete={handleAvailabilityDelete}
        selectedDate={selectedDate || undefined}
        selectedTime={selectedTime || undefined}
      />

      <ClearAvailabilityAlert
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearAllAvailability}
      />
    </div>
  );
};

export default WorkerCalendarPage; 