"use client";

import React from 'react';
import { MapPin, Calendar, Clock, DollarSign, X } from 'lucide-react';
import styles from './AbleAIPage.module.css';
import { GigDetailModalProps } from './types';

const GigDetailModal: React.FC<GigDetailModalProps> = ({ isOpen, gig, onClose, onGoToOffers }) => {
  if (!isOpen || !gig) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{gig.role}</h3>
          <button
            className={styles.closeButton}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalGigDetails}>
            <div className={styles.modalGigDetail}>
              <MapPin size={16} />
              <span>{gig.locationSnippet}</span>
            </div>
            <div className={styles.modalGigDetail}>
              <Calendar size={16} />
              <span>{gig.dateString}</span>
            </div>
            <div className={styles.modalGigDetail}>
              <Clock size={16} />
              <span>{gig.timeString}</span>
            </div>
            <div className={styles.modalGigDetail}>
              <DollarSign size={16} />
              <span>£{gig.hourlyRate}/hr</span>
            </div>
            {gig.estimatedHours && (
              <div className={styles.modalGigDetail}>
                <span>Total: £{gig.totalPay} ({gig.estimatedHours}h)</span>
              </div>
            )}
          </div>
          {gig.gigDescription && (
            <div className={styles.modalDescription}>
              <h4>Description</h4>
              <p>{gig.gigDescription}</p>
            </div>
          )}
          {gig.notesForWorker && (
            <div className={styles.modalNotes}>
              <h4>Notes for Worker</h4>
              <p>{gig.notesForWorker}</p>
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button
            className={styles.goToOffersButton}
            onClick={onGoToOffers}
          >
            Go to Gig Offers
          </button>
        </div>
      </div>
    </div>
  );
};

export default GigDetailModal;