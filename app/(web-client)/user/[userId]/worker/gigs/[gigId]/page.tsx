"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';
import { WorkerUser } from '@/actions/user/get-worker-user';
import { Loader2 } from 'lucide-react';
import styles from './GigDetailsPage.module.css';
import GigDetailsComponent from '@/app/components/gigs/GigDetails';
import type GigDetails from '@/app/types/GigDetailsTypes'; // Adjust import path as needed
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';

async function fetchWorkerGigDetails(user: User | WorkerUser, gigId: string): Promise<GigDetails | null> {
  console.log("Fetching gig details for worker:", user?.uid, "gig:", gigId);

  const isViewQA = false;
  const { gig, status } = await getGigDetails({ gigId, userId: user?.uid, role: 'worker', isViewQA });

  if (!gig || status !== 200) return null;

  return gig;
}

async function checkIfGigIsAvailableOffer(user: User | WorkerUser, gigId: string): Promise<boolean> {
  try {
    const result = await getWorkerOffers(user.uid);
    if (result.success && result.data?.offers) {
      return result.data.offers.some(offer => offer.id === gigId);
    }
    return false;
  } catch (error) {
    console.error("Error checking if gig is available offer:", error);
    return false;
  }
}

export default function WorkerGigDetailsPage() {
  const params = useParams();
  const workerProfileId = params.userId as string; // This is the worker profile ID from the URL
  const gigId = params.gigId as string;

  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [gig, setGig] = useState<GigDetails | null>(null);
  const [isLoadingGig, setIsLoadingGig] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvailableOffer, setIsAvailableOffer] = useState(false);
  const [isCheckingOffer, setIsCheckingOffer] = useState(false);
  const [workerUser, setWorkerUser] = useState<WorkerUser | null>(null);

  // Fetch worker user from worker profile ID
  useEffect(() => {
    const fetchWorkerUser = async () => {
      if (!workerProfileId) return;
      
      try {
        // Import the function to get worker user from profile ID
        const { getWorkerUserFromProfileId } = await import('@/actions/user/get-worker-user');
        const result = await getWorkerUserFromProfileId(workerProfileId);
        
        if (result.success && result.data) {
          setWorkerUser(result.data);
        } else {
          setError("Worker not found");
          setIsLoadingGig(false);
        }
      } catch (err) {
        console.error("Error fetching worker user:", err);
        setError("Could not load worker information");
        setIsLoadingGig(false);
      }
    };

    fetchWorkerUser();
  }, [workerProfileId]);

  // Fetch Gig Details
  useEffect(() => {
    if (loadingAuth || !workerUser) return; // Wait for auth state and worker user to be clear

    const shouldFetch = (user?.claims.role === "QA" && workerProfileId && gigId) ||
      (user && authUserId === workerUser.uid && gigId);

    if (shouldFetch) {
      setIsLoadingGig(true);
      
      // First fetch gig details using the worker user
      fetchWorkerGigDetails(workerUser, gigId)
        .then(data => {
          if (data) {
            setGig(data);
            
            // Then check if this is an available offer
            setIsCheckingOffer(true);
            return checkIfGigIsAvailableOffer(workerUser, gigId);
          } else {
            setError("Gig not found or access denied.");
            return false;
          }
        })
        .then(isOffer => {
          setIsAvailableOffer(isOffer);
        })
        .catch(err => {
          console.error("Failed to fetch gig details:", err);
          setError("Could not load gig details.");
        })
        .finally(() => {
          setIsLoadingGig(false);
          setIsCheckingOffer(false);
        });
    }
  }, [loadingAuth, user, authUserId, workerProfileId, gigId, workerUser]);


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
    console.log('Rendering loading screen, isLoadingGig:', isLoadingGig);
    return (
      <div 
        className={styles.loadingContainer}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: '#1A1A1A',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999
        }}
      >
        <div className={styles.loadingContent}>
          <Loader2 
            className={styles.loadingSpinner} 
            size={48} 
            style={{ color: 'white', animation: 'spin 1s linear infinite' }}
          />
        </div>
      </div>
    );
  }

  if (error) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div></div>;
  }

  if (!gig) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.emptyState}>Gig details not found.</p></div></div>;
  }

  return (
    <GigDetailsComponent 
      userId={workerProfileId} 
      role="worker" 
      gig={gig} 
      setGig={setGig}
      isAvailableOffer={isAvailableOffer}
      isCheckingOffer={isCheckingOffer}
    />
  );
} 