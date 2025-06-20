"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import AppCalendar from "@/app/components/shared/AppCalendar";
import CalendarHeader from "@/app/components/shared/CalendarHeader";
import CalendarEventComponent from "@/app/components/shared/CalendarEventComponent";
import { View } from "react-big-calendar";
// Import the CSS module for this page
import styles from "./BuyerCalendarPage.module.css";
import { useAuth } from "@/context/AuthContext";

// Define the interface for calendar events (should be consistent with WorkerCalendarPage)
interface CalendarEvent {
  id?: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: Record<string, unknown>;
  status?:
    | "PENDING"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "UNAVAILABLE"
    | "OFFER";
  eventType?: "gig" | "offer" | "unavailability";
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
}

const FILTERS = ["Manage availability", "Accepted gigs", "See gig offers"];

const BuyerCalendarPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;
  // Real events would be fetched or passed in here
  const realEvents: CalendarEvent[] = useMemo(() => [], []);

  // Set default view based on screen size
  const [view, setView] = useState<View>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "week";
  });
  const [date, setDate] = useState<Date>(new Date());
  const [activeFilter, setActiveFilter] = useState<string>(FILTERS[1]);
  const [events, setEvents] = useState<CalendarEvent[]>(realEvents);

  useEffect(() => {
    if (loadingAuth) {
      return; // Wait for user data to load
    }

    if (!user) {
      router.push(`/signin?redirect=${pathname}`);
      return;
    }

    if (authUserId !== pageUserId) {
      router.push(`/signin?error=unauthorized`); // Or user's own profile, or a generic error page
      return;
    }
  },[])

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
          view={view}
          onView={setView}
          onNavigate={setDate}
          components={{
            event: (props: any) => (
              <CalendarEventComponent {...props} userRole="buyer" />
            ),
          }}
          hideToolbar={true}
        />
      </main>
      {/* No footer for buyer view as per design */}
    </div>
  );
};

export default BuyerCalendarPage;
