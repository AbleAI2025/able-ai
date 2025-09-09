"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppCalendar from "@/app/components/shared/AppCalendar";
import CalendarHeader from "@/app/components/shared/CalendarHeader";
import CalendarEventComponent from "@/app/components/shared/CalendarEventComponent";
import { getWorkerAvailability } from "@/actions/availability/manage-availability";
import { convertAvailabilitySlotsToEvents } from "@/app/utils/availabilityUtils";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import styles from "./WorkerAvailability.module.css";

const AvailabilityPage = () => {
  const { workerId } = useParams();
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<"day" | "week" | "month">(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      return "day";
    }
    return "week";
  });

  useEffect(() => {
    if (!workerId) return;
    const workerIdStr = Array.isArray(workerId) ? workerId[0] : workerId;

    const fetchAvailability = async () => {
      try {
        const availabilityRes = await getWorkerAvailability(workerIdStr, true); // set isViewQA as needed
        const availabilityEvents = convertAvailabilitySlotsToEvents(
          availabilityRes.availability || [],
          new Date(date.getFullYear(), date.getMonth(), 1),
          new Date(date.getFullYear(), date.getMonth() + 1, 0)
        );
        setEvents(availabilityEvents);
      } catch (error) {
        console.error("Error fetching worker availability:", error);
      }
    };

    fetchAvailability();
  }, [workerId, date]);

  return (
    <div className={styles.container}>
      <CalendarHeader
        date={date}
        view={view}
        role="buyer"
        onViewChange={(view) => {
          if (view === "day" || view === "week" || view === "month") {
            setView(view);
          }
        }}
        onNavigate={(action) => {
          const current = new Date(date);
          if (action === "TODAY") setDate(new Date());
          if (action === "PREV") {
            if (view === "day") current.setDate(current.getDate() - 1);
            if (view === "week") current.setDate(current.getDate() - 7);
            if (view === "month") current.setMonth(current.getMonth() - 1);
            setDate(current);
          }
          if (action === "NEXT") {
            if (view === "day") current.setDate(current.getDate() + 1);
            if (view === "week") current.setDate(current.getDate() + 7);
            if (view === "month") current.setMonth(current.getMonth() + 1);
            setDate(current);
          }
        }}
        filters={[]}
        activeFilter=""
        onFilterChange={() => {}}
      />

      <main className={styles.mainContent}>
        <AppCalendar
          date={date}
          events={events}
          view={view}
          onView={(view) => {
            if (view === "day" || view === "week" || view === "month") {
              setView(view);
            }
          }}
          onNavigate={setDate}
          userRole="buyer"
          activeFilter="availability"
          onSelectEvent={(event) => {
            if (event.status === "AVAILABLE") {
              router.push(`/booking/${workerId}?date=${event.start.toISOString()}`);
            }
          }}
          components={{
            event: (props: any) => (
              <CalendarEventComponent {...props} userRole="buyer" view={view} activeFilter="availability" />
            ),
          }}
          hideToolbar={true}
        />
      </main>
    </div>
  );
};

export default AvailabilityPage;