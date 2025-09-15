"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import { getWorkerProfileIdFromFirebaseUid, getWorkerProfileIdFromUserId } from '@/actions/user/get-worker-user';
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
        // Check if userId is a worker profile ID or user ID
        let actualUserId = userId;
        let isDatabaseUserId = false;
        
        // First try to treat the userId as a worker profile ID and get the user directly
        console.log('🔍 DEBUG: Layout - First attempt - trying as worker profile ID:', userId);
        const { getWorkerUserFromProfileId } = await import('@/actions/user/get-worker-user');
        const workerUserResult = await getWorkerUserFromProfileId(userId);
        console.log('🔍 DEBUG: Layout - Worker user result:', workerUserResult);
        
        if (workerUserResult.success && workerUserResult.data) {
          console.log('🔍 DEBUG: Layout - Found worker user from profile ID, using database user ID:', workerUserResult.data.id);
          actualUserId = workerUserResult.data.id;
          isDatabaseUserId = true;
        } else {
          console.log('🔍 DEBUG: Layout - Not a worker profile ID, trying as Firebase UID...');
          const profileIdResult = await getWorkerProfileIdFromFirebaseUid(userId);
          
          if (profileIdResult.success && profileIdResult.data) {
            console.log('🔍 DEBUG: Layout - Found worker profile ID from Firebase UID:', profileIdResult.data);
            const workerUserResult2 = await getWorkerUserFromProfileId(profileIdResult.data);
            
            if (workerUserResult2.success && workerUserResult2.data) {
              actualUserId = workerUserResult2.data.id;
              isDatabaseUserId = true;
            }
          } else {
            console.log('🔍 DEBUG: Layout - Not a Firebase UID, trying as database user ID:', userId);
            const dbUserIdResult = await getWorkerProfileIdFromUserId(userId);
            
            if (dbUserIdResult.success && dbUserIdResult.data) {
              console.log('🔍 DEBUG: Layout - Found worker profile ID from database user ID:', dbUserIdResult.data);
              const workerUserResult3 = await getWorkerUserFromProfileId(dbUserIdResult.data);
              
              if (workerUserResult3.success && workerUserResult3.data) {
                actualUserId = workerUserResult3.data.id;
                isDatabaseUserId = true;
              }
            }
          }
        }
        
        // Now get gig details with the resolved user ID
        const { gig: fetchedGig, status, error: fetchError } = await getGigDetails({ 
          gigId, 
          userId: actualUserId, 
          role: "worker", 
          isViewQA: false,
          isDatabaseUserId: isDatabaseUserId
        });

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
