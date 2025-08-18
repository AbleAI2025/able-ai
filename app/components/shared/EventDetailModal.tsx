"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { X, Calendar, Clock, MapPin, User } from "lucide-react";
import { CalendarEvent } from "@/app/types/CalendarEventTypes";
import { acceptGigOffer } from "@/actions/gigs/accept-gig-offer";
import { updateGigOfferStatus } from "@/actions/gigs/update-gig-offer-status";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import styles from "./EventDetailModal.module.css";

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  userRole: 'worker' | 'buyer';
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  userRole
}) => {
  const router = useRouter();
  const params = useParams();
  const pageUserId = (params as Record<string, string | string[]>)?.userId;
  const resolvedUserId = Array.isArray(pageUserId) ? pageUserId[0] : pageUserId;

  if (!isOpen || !event) return null;

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (startDate: Date, endDate: Date) => {
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const endTime = endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${startTime} - ${endTime}`;
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'ACCEPTED':
        return '#10b981';
      case 'OFFER':
        return '#3b82f6';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'COMPLETED':
        return '#10b981';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'ACCEPTED':
        return 'Accepted';
      case 'OFFER':
        return 'Offer';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };

  const handleGoToOffer = () => {
    if (event.id && resolvedUserId) {
      router.push(`/user/${resolvedUserId}/${userRole}/gigs/${event.id}`);
    }
    onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{event.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.statusSection}>
            <div 
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(event.status) }}
            >
              {getStatusText(event.status)}
            </div>
          </div>

          <div className={styles.details}>
            <div className={styles.detailRow}>
              <Calendar className={styles.icon} size={16} />
              <span className={styles.label}>Date:</span>
              <span className={styles.value}>{formatDate(new Date(event.start))}</span>
            </div>

            <div className={styles.detailRow}>
              <Clock className={styles.icon} size={16} />
              <span className={styles.label}>Time:</span>
              <span className={styles.value}>
                {formatTime(new Date(event.start), new Date(event.end))}
              </span>
            </div>

            {event.location && (
              <div className={styles.detailRow}>
                <MapPin className={styles.icon} size={16} />
                <span className={styles.label}>Location:</span>
                <span className={styles.value}>{event.location}</span>
              </div>
            )}

            {/* Always show both Buyer and Worker when available */}
            {event.buyerName && (
              <div className={styles.detailRow}>
                <User className={styles.icon} size={16} />
                <span className={styles.label}>Buyer:</span>
                <span className={styles.value}>{event.buyerName}</span>
              </div>
            )}

            {event.workerName && (
              <div className={styles.detailRow}>
                <User className={styles.icon} size={16} />
                <span className={styles.label}>Worker:</span>
                <span className={styles.value}>{event.workerName}</span>
              </div>
            )}

            {event.description && (
              <div className={styles.descriptionSection}>
                <span className={styles.label}>Description:</span>
                <p className={styles.description}>{event.description}</p>
              </div>
            )}
          </div>

          {(event.status === 'ACCEPTED' || event.status === 'OFFER') && (
            <div className={styles.actions}>
              {event.status === 'OFFER' && userRole === 'worker' ? (
                // For offers, redirect to gig offers page
                                                   <button 
                    className={styles.actionButton}
                    onClick={() => {
                      if (resolvedUserId) {
                        router.push(`/user/${resolvedUserId}/worker/offers`);
                      }
                      onClose();
                    }}
                    style={{
                      backgroundColor: userRole === 'worker' ? 'var(--primary-color)' : 'var(--secondary-color)',
                      borderColor: userRole === 'worker' ? 'var(--primary-color)' : 'var(--secondary-color)',
                      color: userRole === 'worker' ? '#ffffff' : '#000000'
                    }}
                  >
                    View All Offers
                  </button>
              ) : (
                // For accepted gigs, show the original button
                                                   <button 
                    className={styles.actionButton}
                    onClick={handleGoToOffer}
                    style={{
                      backgroundColor: userRole === 'worker' ? 'var(--primary-color)' : 'var(--secondary-color)',
                      borderColor: userRole === 'worker' ? 'var(--primary-color)' : 'var(--secondary-color)',
                      color: userRole === 'worker' ? '#ffffff' : '#000000'
                    }}
                  >
                    Go to Offer
                  </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailModal;