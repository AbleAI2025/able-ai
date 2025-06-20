"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import styles from './GigDetailsPage.module.css';
import GigDetailsComponent from '@/app/components/gigs/GigDetails';
import type GigDetails from '@/app/types/GigDetailsTypes'; // Adjust import path as needed


// Define interface for Gig details

// Mock function to fetch gig details - replace with actual API call
async function fetchWorkerGigDetails(userId: string, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for worker:", userId, "gig:", gigId);
  // API call: GET /api/gigs/worker/${gigId} (ensure backend auth checks worker owns this gig)
  // Or: GET /api/gigs/${gigId} and then verify workerId matches on client
  await new Promise(resolve => setTimeout(resolve, 700));

  // Example Data (should match the actual GigDetails interface)
  if (gigId === "gig123-accepted") {
    return {
      id: "gig123-accepted", 
      role: "Lead Bartender", 
      gigTitle: "Corporate Mixer Event",
      buyerName: "Innovate Solutions Ltd.", buyerAvatarUrl: "/images/logo-placeholder.svg",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(18,0,0,0).toString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).setHours(23,0,0,0).toString(),
      location: "123 Business Rd, Tech Park, London, EC1A 1BB",
      hourlyRate: 25, estimatedEarnings: 125,
      specialInstructions: "Focus on high-quality cocktails. Dress code: smart black. Setup starts 30 mins prior. Contact person on site: Jane (07xxxxxxxxx).",
      status: "IN_PROGRESS", // Initially pending
      hiringManager: "Jane Smith",
      hiringManagerUsername: "@janesmith",
      isBuyerSubmittedFeedback: true,
      isWorkerSubmittedFeedback: false,
    };
  }
  if (gigId === "gig456-inprogress") {
     return {
      id: "gig456-inprogress", 
      role: "Event Server", 
      gigTitle: "Wedding Reception",
      buyerName: "Alice & Bob",
      date: new Date().toISOString(), // Today
      startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
      location: "The Manor House, Countryside Lane, GU21 5ZZ",
      hourlyRate: 18, estimatedEarnings: 108,
      specialInstructions: "Silver service required. Liaise with the event coordinator Sarah upon arrival.",
      status: "IN_PROGRESS", // Initially completed
      hiringManager: "Sarah Johnson",
      hiringManagerUsername: "@sarahjohnson",
      isBuyerSubmittedFeedback: true,
      isWorkerSubmittedFeedback: false,
    };
  }
  return null; // Or throw an error
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
      fetchWorkerGigDetails(pageUserId, gigId) // pageUserId is correct here (worker's ID from URL)
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
    <GigDetailsComponent gig={gig} setGig={setGig} />
  );
} 