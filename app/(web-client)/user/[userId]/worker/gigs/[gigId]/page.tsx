"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import styles from './GigDetailsPage.module.css';
import GigDetailsComponent from '@/app/components/gigs/GigDetails';
import type GigDetails from '@/app/types/GigDetailsTypes'; // Adjust import path as needed
import { getGigDetails } from '@/actions/gigs/get-gig-details';

async function fetchWorkerGigDetails(user: User, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for worker:", user?.uid, "gig:", gigId);

  const isViewQA = user?.claims.role === "QA";
  const { gig, status } = await getGigDetails({ gigId, userId: user?.uid, role: 'worker', isViewQA });

  if (!gig || status !== 200) return null;

  return gig;
}

export default function WorkerGigDetailsPage() {
  const params = useParams();
  const pageUserId = params.userId as string; // This is the worker's ID from the URL
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [gig, setGig] = useState<GigDetails | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Gig Details
  useEffect(() => {
    if (loadingAuth) return; // Wait for auth state to be clear

    const shouldFetch = (user?.claims.role === "QA" && pageUserId && gigId) ||
      (user && authUserId === pageUserId && gigId);

    if (shouldFetch) {
      setIsLoadingGig(true);
      fetchWorkerGigDetails(user, gigId) // pageUserId is correct here (worker's ID from URL)
        .then(data => {
          if (data) {
            setGig(data);
          } else {
            setError("Gig not found or access denied.");
          }
        })
        .catch(err => {
          console.error("Failed to fetch gig details:", err);
          setError("Could not load gig details.");
        })
        .finally(() => setIsLoadingGig(false));
    }
  }, [loadingAuth, user, authUserId, pageUserId, gigId, setIsLoadingGig]);


  /*
  const getStatusBadgeClass = (status: GigDetails['status']) => {
    switch (status) {
        case 'ACCEPTED': return styles.statusAccepted;
        case 'IN_PROGRESS': return styles.statusInProgress;
        case 'AWAITING_BUYER_CONFIRMATION': return styles.statusAwaitingConfirmation;
        case 'COMPLETED': return styles.statusCompleted;
        case 'CANCELLED': return styles.statusCancelled;
        default: return '';
    }
  }
  */

  if (isLoadingGig) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading Gig Details...</div>;
  }

  if (error) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div></div>;
  }

  if (!gig) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.emptyState}>Gig details not found.</p></div></div>;
  }

  return (
    <GigDetailsComponent userId={pageUserId} role="worker" gig={gig} setGig={setGig} />
  );
} 