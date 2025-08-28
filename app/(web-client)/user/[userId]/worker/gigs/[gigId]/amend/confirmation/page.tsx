'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './AmendGigConfirmationPage.module.css';

interface Gig {
  id: string;
  gigDescription: string;
  gigDate: string;
  gigTime: string;
  hourlyRate: number;
  location: string;
  statusInternal: string;
  buyerId: string;
  workerId: string;
}

interface AmendmentRequest {
  id: string;
  gigId: string;
  changes: string;
  requestedBy: string;
  requestedAt: string;
  status: string;
}

export default function AmendGigConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [amendmentRequest, setAmendmentRequest] = useState<AmendmentRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  const gigId = params.gigId as string;
  const userId = params.userId as string;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch gig details
        const gigResponse = await fetch(`/api/gigs/${gigId}`);
        if (gigResponse.ok) {
          const gigData = await gigResponse.json();
          setGig(gigData);
        }

        // Fetch amendment request
        const amendmentResponse = await fetch(`/api/gigs/${gigId}/amendment-request`);
        if (amendmentResponse.ok) {
          const amendmentData = await amendmentResponse.json();
          setAmendmentRequest(amendmentData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [gigId, user]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]);
      const startMin = timeMatch[2];
      const endHour = parseInt(timeMatch[3]);
      const endMin = timeMatch[4];
      
      const startPeriod = startHour >= 12 ? 'PM' : 'AM';
      const endPeriod = endHour >= 12 ? 'PM' : 'AM';
      
      const startDisplayHour = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour;
      const endDisplayHour = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour;
      
      return `${startDisplayHour}:${startMin} ${startPeriod} - ${endDisplayHour}:${endMin} ${endPeriod}`;
    }
    return timeStr;
  };

  const calculateDuration = (timeStr: string) => {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
    if (timeMatch) {
      const startHour = parseInt(timeMatch[1]);
      const endHour = parseInt(timeMatch[3]);
      const duration = endHour - startHour;
      return Math.max(duration, 1);
    }
    return 4;
  };

  const calculateTotalPay = (hourlyRate: number, duration: number) => {
    return (hourlyRate * duration).toFixed(2);
  };

  const handleConfirmChanges = async () => {
    if (!gig || !amendmentRequest || !user) return;
    
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/gigs/${gigId}/confirm-amendment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amendmentId: amendmentRequest.id,
          confirmedBy: 'worker',
          confirmedAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        router.push(`/user/${userId}/worker/gigs/${gigId}`);
      } else {
        console.error('Failed to confirm amendment');
      }
    } catch (error) {
      console.error('Error confirming amendment:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDeclineChanges = async () => {
    if (!gig || !amendmentRequest || !user) return;
    
    if (window.confirm('Are you sure you want to decline these changes?')) {
      try {
        const response = await fetch(`/api/gigs/${gigId}/decline-amendment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amendmentId: amendmentRequest.id,
            declinedBy: 'worker',
            declinedAt: new Date().toISOString()
          }),
        });

        if (response.ok) {
          router.push(`/user/${userId}/worker/gigs/${gigId}`);
        } else {
          console.error('Failed to decline amendment');
        }
      } catch (error) {
        console.error('Error declining amendment:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!gig || !amendmentRequest) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Amendment request not found</div>
      </div>
    );
  }

  const duration = calculateDuration(gig.gigTime);
  const totalPay = calculateTotalPay(gig.hourlyRate, duration);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Confirm amended Gig Details</h1>
        <span className={styles.infoIcon}>ℹ️</span>
      </div>

      <div className={styles.confirmationMessage}>
        <div className={styles.aiIcon}>🤖</div>
        <p>Sue has added one hour to the gig, the update details are below. Please accept to confirm these changes</p>
      </div>

      <div className={styles.updatedDetailsSection}>
        <h3>Updated gig details:</h3>
        
        <div className={styles.detailsGrid}>
          <div className={styles.detailRow}>
            <span className={styles.label}>Location:</span>
            <span className={styles.value}>{gig.location}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Date:</span>
            <span className={styles.value}>{formatDate(gig.gigDate)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Time:</span>
            <span className={styles.value}>{formatTime(gig.gigTime)}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Pay per hour:</span>
            <span className={styles.value}>£{gig.hourlyRate}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.label}>Total Pay:</span>
            <span className={styles.value}>£{totalPay}</span>
          </div>
        </div>

        <div className={styles.changesSummary}>
          <p><strong>Requested Changes:</strong> {amendmentRequest.changes}</p>
          <p><strong>Requested by:</strong> {amendmentRequest.requestedBy === 'buyer' ? 'Buyer' : 'Worker'}</p>
          <p><strong>Requested on:</strong> {formatDate(amendmentRequest.requestedAt)}</p>
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button 
          className={styles.confirmButton}
          onClick={handleConfirmChanges}
          disabled={isConfirming}
        >
          {isConfirming ? 'Confirming...' : 'Confirm changes'}
        </button>
        <button 
          className={styles.declineButton}
          onClick={handleDeclineChanges}
          disabled={isConfirming}
        >
          Decline changes
        </button>
      </div>
    </div>
  );
}
