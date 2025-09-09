"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import type GigDetails from '@/app/types/GigDetailsTypes';
import { GigAmendContext } from '@/context/GigAmendContext';
import { Loader2 } from 'lucide-react';
import styles from './GigDetailsPage.module.css'; 

export default function GigLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const { user, loading: loadingAuth } = useAuth();

  const gigId = params.gigId as string;
  const userId = params.userId as string;

  const [gig, setGig] = useState<GigDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loadingAuth || !user || !gigId || !userId) {
      return;
    }

    const fetchCoreGigDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { gig: fetchedGig, status, error: fetchError } = await getGigDetails({ gigId, userId, role: "worker", isViewQA: false });

        if (fetchedGig && status === 200) {
          setGig(fetchedGig);
        } else {
          setError(fetchError || "Gig not found or access denied.");
        }
      } catch (err) {
        console.error("Failed to fetch gig details in layout:", err);
        setError("Could not load gig details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoreGigDetails();
  }, [gigId, userId, user, loadingAuth]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} size={48} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.container}><div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div></div>;
  }

  return (
    <GigAmendContext.Provider value={{ gig, setGig, isLoading, error }}>
      {children}
    </GigAmendContext.Provider>
  );
}
