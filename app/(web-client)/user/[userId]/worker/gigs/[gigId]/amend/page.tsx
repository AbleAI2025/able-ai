'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './AmendGigPage.module.css';

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

export default function AmendGigPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [changes, setChanges] = useState('');
  const [updatedDetails, setUpdatedDetails] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const gigId = params.gigId as string;
  const userId = params.userId as string;

  useEffect(() => {
    const fetchGig = async () => {
      if (!user) return;
      
      try {
        const response = await fetch(`/api/gigs/${gigId}`);
        if (response.ok) {
          const gigData = await response.json();
          setGig(gigData);
        } else {
          console.error('Failed to fetch gig');
        }
      } catch (error) {
        console.error('Error fetching gig:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGig();
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

  const handleSubmit = async () => {
    if (!gig || !user || !changes.trim()) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        gigId: gig.id,
        changes: changes.trim(),
        requestedBy: 'worker',
        requestedAt: new Date().toISOString()
      };

      const response = await fetch('/api/gigs/amend-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(`/user/${userId}/worker/gigs/${gigId}/amend/confirmation`);
      } else {
        console.error('Failed to submit amendment request');
      }
    } catch (error) {
      console.error('Error submitting amendment request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelGig = async () => {
    if (!gig || !user) return;
    
    if (window.confirm('Are you sure you want to cancel this gig? This might incur charges or penalties.')) {
      try {
        const response = await fetch(`/api/gigs/${gigId}/cancel`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cancelledBy: 'worker',
            reason: 'Worker requested cancellation'
          }),
        });

        if (response.ok) {
          router.push(`/user/${userId}/worker/gigs`);
        } else {
          console.error('Failed to cancel gig');
        }
      } catch (error) {
        console.error('Error cancelling gig:', error);
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

  if (!gig) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Gig not found</div>
      </div>
    );
  }

  const duration = calculateDuration(gig.gigTime);
  const totalPay = calculateTotalPay(gig.hourlyRate, duration);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Cancel or Amend Gig Details</h1>
      </div>

      <div className={styles.changesSection}>
        <div className={styles.aiIcon}>🤖</div>
        <p>What changes would you like to make to the gig? Tell me or edit using the icon below</p>
        
        <textarea
          className={styles.changesInput}
          placeholder="e.g., Add one more hour to the gig or pay £22ph"
          value={changes}
          onChange={(e) => setChanges(e.target.value)}
          rows={4}
        />
      </div>

      <div className={styles.updatedDetailsSection}>
        <div className={styles.sectionHeader}>
          <h3>Updated gig details:</h3>
          <span className={styles.editIcon}>✏️</span>
        </div>
        
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

        {changes.trim() && (
          <div className={styles.changesSummary}>
            <p>Add one more hour. Total gig value is now £{(gig.hourlyRate * (duration + 1)).toFixed(2)}, with Able and payment provider fees of £{((gig.hourlyRate * (duration + 1)) * 0.1).toFixed(2)}.</p>
          </div>
        )}
      </div>

      <div className={styles.actionButtons}>
        <button 
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting || !changes.trim()}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Confirmation'}
        </button>
        <button 
          className={styles.cancelButton}
          onClick={handleCancelGig}
        >
          Cancel gig
          <span className={styles.cancelWarning}>(this might incur charges or penalties)</span>
        </button>
      </div>
    </div>
  );
}
