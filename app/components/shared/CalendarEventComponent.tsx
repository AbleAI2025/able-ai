"use client";

import React from "react";
import styles from "./CalendarEventComponent.module.css";

// Optionally import an icon library for checkmark, etc.
// import { FaCheckCircle } from "react-icons/fa";

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

interface CalendarEventComponentProps {
  event: CalendarEvent;
}

const CalendarEventComponent: React.FC<CalendarEventComponentProps> = ({ event }) => {
  // Format time (e.g., 9:00 AM - 11:00 AM)
  const formatTime = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
    return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
  };

  // Status badge logic
  let statusClass = styles.statusBadge;
  let statusText: string = event.status || "";
  if (event.status === "ACCEPTED") {
    statusClass += " " + (event.isBuyerAccepted ? styles.statusBuyerAccepted : styles.statusAccepted);
    statusText = "Accepted";
  } else if (event.status === "OFFER") {
    statusClass += " " + styles.statusOffer;
    statusText = "Offer";
  } else if (event.status === "PENDING") {
    statusClass += " " + styles.statusPending;
    statusText = "Pending";
  } else if (event.status === "IN_PROGRESS") {
    statusClass += " " + styles.statusInProgress;
    statusText = "In Progress";
  } else if (event.status === "COMPLETED") {
    statusClass += " " + styles.statusCompleted;
    statusText = "Completed";
  } else if (event.status === "CANCELLED") {
    statusClass += " " + styles.statusCancelled;
    statusText = "Cancelled";
  } else if (event.status === "UNAVAILABLE") {
    statusClass += " " + styles.statusUnavailable;
    statusText = "Unavailable";
  }

  // Action buttons logic (example: Accept, Pending)
  const renderActionButtons = () => {
    if (event.status === "OFFER") {
      return (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionButton} ${styles.accept}`}>Accept</button>
        </div>
      );
    }
    if (event.status === "PENDING") {
      return (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionButton} ${styles.pending}`} disabled>
            Pending
          </button>
        </div>
      );
    }
    return null;
  };

  // Names logic (show buyer/worker name as appropriate)
  let names = null;
  if (event.buyerName && event.status === "ACCEPTED" && event.isBuyerAccepted) {
    names = <span className={styles.eventNames}>Accepted by {event.buyerName}</span>;
  } else if (event.workerName && event.status === "ACCEPTED" && !event.isBuyerAccepted) {
    names = <span className={styles.eventNames}>Accepted by {event.workerName}</span>;
  }

  // Checkmark icon for accepted/completed
  // const checkIcon = (event.status === "ACCEPTED" || event.status === "COMPLETED") ? (
  //   <FaCheckCircle className={styles.checkIcon} />
  // ) : null;

  return (
    <div className={styles.eventContainer}>
      <div className={styles.eventTitle}>{event.title}</div>
      <div className={styles.eventTime}>{formatTime(new Date(event.start), new Date(event.end))}</div>
      <span className={statusClass}>{statusText}</span>
      {names}
      {/* {checkIcon} */}
      {renderActionButtons()}
    </div>
  );
};

export default CalendarEventComponent; 