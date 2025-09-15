"use client";

import React, { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getGigDetails } from '@/actions/gigs/get-gig-details';
import { getWorkerProfileIdFromFirebaseUid, getWorkerProfileIdFromUserId } from '@/actions/user/get-worker-user';
import type GigDetails from '@/app/types/GigDetailsTypes';
import { GigAmendContext } from '@/context/GigAmendContext';
import { Loader2 } from 'lucide-react';
import styles from './GigLayout.module.css';

interface GigLayoutProps {
  children: React.ReactNode;
}

export default function GigLayout({ children }: GigLayoutProps) {
  const params = useParams();
  const pathname = usePathname();
  const { user, loading: loadingAuth } = useAuth();

  const gigId = params.gigId as string;
  const userId = params.userId as string;

  const [gig, setGig] = useState<GigDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userRole = pathname.includes('/worker/') ? 'worker' : 'buyer';

  useEffect(() => {
    if (loadingAuth || !user || !gigId || !userId) return;

    const fetchCoreGigDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let actualUserId = userId;
        let isDatabaseUserId = false;
        
        const { getWorkerUserFromProfileId } = await import('@/actions/user/get-worker-user');
        const workerUserResult = await getWorkerUserFromProfileId(userId);
        
        if (workerUserResult.success && workerUserResult.data) {
          actualUserId = workerUserResult.data.id;
          isDatabaseUserId = true;
        } else {
          const profileIdResult = await getWorkerProfileIdFromFirebaseUid(userId);
          
          if (profileIdResult.success && profileIdResult.data) {
            const workerUserResult2 = await getWorkerUserFromProfileId(profileIdResult.data);
            
            if (workerUserResult2.success && workerUserResult2.data) {
              actualUserId = workerUserResult2.data.id;
              isDatabaseUserId = true;
            }
          } else {
            const dbUserIdResult = await getWorkerProfileIdFromUserId(userId);
            
            if (dbUserIdResult.success && dbUserIdResult.data) {
              const workerUserResult3 = await getWorkerUserFromProfileId(dbUserIdResult.data);
              
              if (workerUserResult3.success && workerUserResult3.data) {
                actualUserId = workerUserResult3.data.id;
                isDatabaseUserId = true;
              }
            }
          }
        }
        
        const { gig: fetchedGig, status, error: fetchError } = await getGigDetails({ 
          gigId, 
          userId: actualUserId, 
          role: userRole,
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
  }, [gigId, userId, user, loadingAuth, userRole]);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.loadingSpinner} size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <GigAmendContext.Provider value={{ gig, setGig, isLoading, error }}>
      {children}
    </GigAmendContext.Provider>
  );
}
