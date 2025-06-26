"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import AppCalendar from "@/app/components/shared/AppCalendar";
import CalendarHeader from "@/app/components/shared/CalendarHeader";
import CalendarEventComponent from "@/app/components/shared/CalendarEventComponent";
import { View } from "react-big-calendar";
import { useAuth } from "@/context/AuthContext";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { getCalendarEvents } from "@/actions/events/get-calendar-events";
// Import the CSS module for this page
import styles from "./BuyerCalendarPage.module.css";

const FILTERS = ["Manage availability", "Accepted gigs", "See gig offers"];

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

const BuyerCalendarPage = () => {
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
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[1]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (loadingAuth) {
      return;
    }

    if (!user) {
      router.push(`/signin?redirect=${pathname}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push(`/signin?error=unauthorized`); // Or user's own profile, or a generic error page
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      const isViewQA = localStorage.getItem('isViewQA') === 'true';
      const res = await getCalendarEvents({ userId: user.uid, role: 'buyer', isViewQA });

      if(res.error) throw new Error(res.error);

      const data: CalendarEvent[] = res.events;

      // Convert date strings to Date objects
      const parsed = data.map((event: any) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));
      setEvents(filterEvents(parsed, activeFilter));
    };

    fetchEvents();
  }, [activeFilter]);


  // Calendar navigation handler
  const handleNavigate = (action: "TODAY" | "PREV" | "NEXT") => {
    const current = new Date(date);
    if (action === "TODAY") {
      setDate(new Date());
    } else if (action === "PREV") {
      if (view === "day") current.setDate(current.getDate() - 1);
      if (view === "week") current.setDate(current.getDate() - 7);
      if (view === "month") current.setMonth(current.getMonth() - 1);
      setDate(current);
    } else if (action === "NEXT") {
      if (view === "day") current.setDate(current.getDate() + 1);
      if (view === "week") current.setDate(current.getDate() + 7);
      if (view === "month") current.setMonth(current.getMonth() + 1);
      setDate(current);
    }
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
        onFilterChange={setActiveFilter}
      />
      <main className={styles.mainContent}>
        <AppCalendar
          events={events}
          date={date}
          view={view}
          onView={setView}
          onNavigate={setDate}
          components={{
            event: ((props: CalendarEvent) => (
              <CalendarEventComponent event={props} />
            )) as React.ComponentType<unknown>,
          }}
          hideToolbar={true}
        />
      </main>
      {/* No footer for buyer view as per design */}
    </div>
  );
};

export default BuyerCalendarPage;
