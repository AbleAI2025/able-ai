"use client";
import React, { useState, useEffect } from 'react';
import styles from './GigOfferCard.module.css';
import { MapPin, CalendarDays, Clock, DollarSign, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Loader2 } from 'lucide-react';

const GigOfferCard = ({
  offer,
  onAccept,
  onDecline,
  onViewDetails,
  isProcessingAccept = false,
  isProcessingDecline = false,
}) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!offer.expiresAt) {
      setTimeLeft('');
      return;
    }

    const calculateTimeLeft = () => {
      const expirationDate = new Date(offer.expiresAt);
      const now = new Date();
      const difference = expirationDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      let timeLeftString = "";
      if (minutes > 0) timeLeftString += `${minutes} mins `;
      timeLeftString += `${seconds} secs`;

      setTimeLeft(timeLeftString);
    };

    calculateTimeLeft();
    const intervalId = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(intervalId);
  }, [offer.expiresAt]);

  const totalPayDisplay = offer.totalPay
    ? `£${offer.totalPay.toFixed(2)} + tips`
    : offer.estimatedHours
      ? `Est. £${(offer.hourlyRate * offer.estimatedHours).toFixed(2)} + tips`
      : null;

  const isExpired = timeLeft === "Expired" || offer.status === 'expired';

  return (
    <div role="button"tabIndex={0} className={`${styles.card} ${isExpired ? styles.expired : ''}`} onClick={() => onViewDetails(offer.id)}>
      <div className={styles.cardHeader}>
        <h3 className={styles.role}>{offer.role}</h3>
        {timeLeft && !isExpired && (
            <div className={styles.timerContainer}>
              <Clock size={30} color="#fff" className={styles.timerIcon} />
              <span className={styles.timerText}>{timeLeft} <br/> to accept</span>
            </div>
        )}
      </div>
      <div className={styles.gigDetails}>
          <p className={styles.gigLocation}>
            <span className={styles.detailIcon}><MapPin size={12} /></span>
            {offer.locationSnippet}
          </p>
          <p className={styles.gigTime}>
            <span className={styles.detailIcon}><Clock size={12} /></span>
            {offer.timeString}
          </p>
          <p className={styles.gigDate}>
            <span className={styles.detailIcon}><CalendarDays size={12} /></span>
            {offer.dateString}
          </p>
          <p className={styles.gigPay}>
            <span className={styles.detailIcon}><DollarSign size={12} /></span>
            {totalPayDisplay ? totalPayDisplay : `£${offer.hourlyRate.toFixed(2)}/hr + tips`}
          </p>
        
      </div>
      <div className={styles.buttons}>
        <button
          onClick={() => onAccept(offer.id)}
          className={`${styles.button} ${styles.acceptButton} ${isProcessingAccept ? styles.processing : ''}`}
          disabled={isProcessingAccept || isProcessingDecline || isExpired}
        >
             {isProcessingAccept ? <Loader2 size={16} className="animate-spin"/> : 'Accept'}
        </button>
        <button
          onClick={() => onDecline(offer.id)}
          className={`${styles.button} ${styles.declineButton} ${isProcessingDecline ? styles.processing : ''}`}
          disabled={isProcessingDecline || isProcessingAccept || isExpired}
        >
            {isProcessingDecline ? <Loader2 size={16} className="animate-spin"/> : 'Decline'}
        </button>
      </div>
      {isExpired && (
        <div className={styles.expiredOverlay}>
          <AlertTriangle size={24} className={styles.expiredIcon} />
          <span className={styles.expiredText}>Expired</span>
        </div>
      )}
    </div>
  );
};

export default GigOfferCard; 