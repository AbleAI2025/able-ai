"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth, User } from '@/context/AuthContext';
import { useGigAmendContext } from '@/context/GigAmendContext';
import { WorkerUser } from '@/actions/user/get-worker-user';
import GigDetailsComponent from '@/app/components/gigs/GigDetails';
import { getWorkerOffers } from '@/actions/gigs/get-worker-offers';
import styles from './GigDetailsPage.module.css';

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
  const workerProfileId = params.userId as string;
  const gigId = params.gigId as string;
  const { user } = useAuth();
  
  const { gig, setGig } = useGigAmendContext();

  const [isAvailableOffer, setIsAvailableOffer] = useState(false);
  const [isCheckingOffer, setIsCheckingOffer] = useState(true);

  useEffect(() => {
    if (!user || !gig) return;

    const checkOfferStatus = async () => {
      setIsCheckingOffer(true);
      const isOffer = await checkIfGigIsAvailableOffer(user, gigId);
      setIsAvailableOffer(isOffer);
      setIsCheckingOffer(false);
    };

    checkOfferStatus();
  }, [user, gig, gigId]);

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
