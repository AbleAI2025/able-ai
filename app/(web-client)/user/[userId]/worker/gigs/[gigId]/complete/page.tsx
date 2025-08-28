'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './CompleteGigPage.module.css';

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

export default function CompleteGigPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [gig, setGig] = useState<Gig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState('');
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null);
  const [awardBuyer, setAwardBuyer] = useState<string>('');
  const [expenses, setExpenses] = useState('');
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

  const calculateDuration = (timeStr: string) => {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    if (timeMatch) {
      let startHour = parseInt(timeMatch[1]);
      let endHour = parseInt(timeMatch[4]);
      
      if (timeMatch[3]?.toLowerCase() === 'pm' && startHour !== 12) startHour += 12;
      if (timeMatch[6]?.toLowerCase() === 'pm' && endHour !== 12) endHour += 12;
      if (timeMatch[3]?.toLowerCase() === 'am' && startHour === 12) startHour = 0;
      if (timeMatch[6]?.toLowerCase() === 'am' && endHour === 12) endHour = 0;
      
      const duration = endHour - startHour;
      return Math.max(duration, 1); // Minimum 1 hour
    }
    return 4; // Default fallback
  };

  const calculateEarnings = (hourlyRate: number, duration: number) => {
    return (hourlyRate * duration).toFixed(2);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async () => {
    if (!gig || !user) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        gigId: gig.id,
        feedback,
        wouldWorkAgain,
        awardBuyer,
        expenses: expenses.trim() || null,
        completedAt: new Date().toISOString()
      };

      const response = await fetch('/api/gigs/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(`/user/${userId}/worker/gigs/${gigId}`);
      } else {
        console.error('Failed to complete gig');
      }
    } catch (error) {
      console.error('Error completing gig:', error);
    } finally {
      setIsSubmitting(false);
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
  const earnings = calculateEarnings(gig.hourlyRate, duration);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Confirm Hours Worked & Feedback</h1>
      </div>

      <div className={styles.gigSummary}>
        <h2>{gig.gigDescription}</h2>
        <p><strong>Duration:</strong> {duration} hours</p>
        <p><strong>Completed gig on:</strong> {formatDate(gig.gigDate)}</p>
        <p><strong>Location:</strong> {gig.location}</p>
        <p><strong>Earnings:</strong> £{earnings}</p>
      </div>

      <div className={styles.feedbackSection}>
        <h3>Share your experience...</h3>
        <p>Provide feedback to earn awards</p>
        
        <textarea
          className={styles.feedbackInput}
          placeholder="Tell us about your experience working this gig..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />

        <div className={styles.workAgainSection}>
          <h4>Would you work with this buyer again?</h4>
          <div className={styles.thumbsContainer}>
            <button
              className={`${styles.thumbsButton} ${wouldWorkAgain === true ? styles.active : ''}`}
              onClick={() => setWouldWorkAgain(true)}
            >
              👍
            </button>
            <button
              className={`${styles.thumbsButton} ${wouldWorkAgain === false ? styles.active : ''}`}
              onClick={() => setWouldWorkAgain(false)}
            >
              👎
            </button>
          </div>
        </div>

        <div className={styles.awardSection}>
          <h4>Would you like to award the buyer?</h4>
          <div className={styles.awardButtons}>
            <button
              className={`${styles.awardButton} ${awardBuyer === 'top_communicator' ? styles.active : ''}`}
              onClick={() => setAwardBuyer(awardBuyer === 'top_communicator' ? '' : 'top_communicator')}
            >
              🏆 Top communicator
            </button>
            <button
              className={`${styles.awardButton} ${awardBuyer === 'team_builder' ? styles.active : ''}`}
              onClick={() => setAwardBuyer(awardBuyer === 'team_builder' ? '' : 'team_builder')}
            >
              👥 Team builder
            </button>
          </div>
        </div>
      </div>

      <div className={styles.expensesSection}>
        <h3>Log any expenses you incurred here</h3>
        <div className={styles.expensesInput}>
          <span className={styles.paperclipIcon}>📎</span>
          <input
            type="text"
            placeholder="Note & upload images of costs incurred for your taxi"
            value={expenses}
            onChange={(e) => setExpenses(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.actionButtons}>
        <button className={styles.amendButton}>
          Amend gig timing or add tips
        </button>
        <button 
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for payment'}
        </button>
      </div>
    </div>
  );
}
