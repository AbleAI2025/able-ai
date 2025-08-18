"use client";

import React from "react";
import styles from "./CalendarEventComponent.module.css";
import { Check, Clock, User, Eye } from "lucide-react";
import { View } from 'react-big-calendar';
import { useRouter } from "next/navigation";

// Optionally import an icon library for checkmark, etc.


export interface CalendarEvent {
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
    | "OFFER"
    | "AVAILABLE";
  eventType?: "gig" | "offer" | "unavailability" | "availability";
  buyerName?: string;
  workerName?: string;
  isMyGig?: boolean;
  isBuyerAccepted?: boolean;
  location?: string;
}

interface CalendarEventComponentProps {
  event: CalendarEvent;
  userRole: string;
  view?: View;
  activeFilter?: string;
}

const CalendarEventComponent: React.FC<CalendarEventComponentProps> = ({ 
  event, 
  userRole, 
  view = 'day',
  activeFilter
}) => {

  const router = useRouter();
  // Format time (e.g., 9:00 AM - 11:00 AM)
  const formatTime = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { 
      hour: "numeric", 
      minute: "2-digit",
      hour12: true 
    };
    return `${start.toLocaleTimeString([], opts)} - ${end.toLocaleTimeString([], opts)}`;
  };

  // Status badge logic
  let statusClass = styles.statusBadge;
  let statusText: string = event.status || "";
  if (event.status === "ACCEPTED") {
    statusClass += " " + (userRole === 'buyer' ? styles.statusBuyerAccepted : styles.statusAccepted);
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
  } else if (event.status === "AVAILABLE") {
    statusClass += " " + styles.statusAvailable;
    statusText = "Available";
  }

  // Checkmark icon for accepted/completed
  const checkIcon = (event.status === "ACCEPTED" || event.status === "COMPLETED") ? (    
      <Check color="#ffffff" size={30} />
  ) : null;

  // For month view, show minimal content
  if (view === 'month') {
    return (
      <div className={styles.eventContainer} data-view="month">
        <div className={styles.eventHeader}>
                  <div className={styles.eventTitle} style={{
          fontWeight: (activeFilter === 'Accepted gigs' && event.status === 'ACCEPTED') ? '700' : '500'
        }}>
          {event.title}
        </div>
          {checkIcon}
        </div>
      </div>
    );
  }

  // For week view, show compact content
  if (view === 'week') {
    return (
      <div className={styles.eventContainer} data-view="week">
        <div className={styles.eventHeader}>
          <div className={styles.eventTitle}>
            {event.title}
          </div>
          {checkIcon}
        </div>
        
        <div className={styles.eventDetails}>
          <div className={styles.eventTime}>
            <Clock size={12} className={styles.timeIcon} />
            {formatTime(new Date(event.start), new Date(event.end))}
          </div>
          
          <div className={styles.statusSection}>
            <span className={statusClass}>{statusText}</span>
          </div>
        </div>
      </div>
    );
  }

  // For day view, show full content with View Gig button
  return (
    <div 
      className={[
      styles.eventContainer,
      event.status === "ACCEPTED" && (userRole === 'worker' ? styles.dayAcceptedBg : styles.dayAcceptedBgBuyer),
      event.status === "OFFER" && styles.dayOfferStyle
      ].filter(Boolean).join(" ")}
      data-view="day"
    >
      <div className={styles.eventHeader}>
        <div className={styles.eventTitle}>
          {event.title} : {event.location}
        </div>
        {checkIcon}
      </div>
      
      <div className={styles.eventDetails}>
        {userRole === 'worker' && (
          <div className={styles.statusSection}>
            <span className={statusClass}>{statusText}</span>
          </div>
        )}
        <div className={styles.eventTime}>
          <Clock size={12} className={styles.timeIcon} />
          {formatTime(new Date(event.start), new Date(event.end))}
        </div>     

        {(event.buyerName || event.workerName) && (
          <div className={`${styles.participantInfo} ${styles.participantSplit}`}>
            <div className={styles.participantLeft}>
              <User size={12} className={styles.userIcon} />
              <span className={styles.participantName}>
                {userRole === 'buyer' ? (event.buyerName || 'You') : (event.buyerName || '')}
              </span>
            </div>
            <div className={styles.participantRight}>
              <span className={styles.participantName}>
                {userRole === 'buyer' ? (event.workerName || '') : 'You'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Accept button for offers */}
      {(event.status === 'OFFER') && (
        <div className={styles.actionButtons}>
          <button 
            className={`${styles.actionButton} ${userRole === 'buyer' ? styles.pendingBtn : styles.acceptBtn}`}
          >
            {userRole === 'buyer' ? 'Pending' : 'Accept'}
          </button>
        </div>
      )}

      {/* Edit button for availability events */}
      {event.status === 'AVAILABLE' && (
        <div className={styles.actionButtons}>
          <button className={`${styles.actionButton} ${styles.editAvailabilityBtn}`}>
            <Eye size={12} className={styles.viewIcon} />
            Edit
          </button>
        </div>
      )}
    </div>
  );
};

export default CalendarEventComponent; 