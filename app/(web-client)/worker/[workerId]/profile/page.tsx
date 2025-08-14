"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import { Loader2 } from 'lucide-react';
import styles from './page.module.css'; // Use page.module.css
import WorkerProfile from '@/app/components/profile/WorkerProfile';

// --- INTERFACE (Adapted for image elements) ---
import PublicWorkerProfile from '@/app/types/workerProfileTypes';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';
import { useAuth } from '@/context/AuthContext';

// --- COMPONENT ---
export default function PublicWorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerProfileIdToView = params.workerId as string;

  const { user ,loading: loadingAuth } = useAuth();

  const [workerProfile, setWorkerProfile] = useState<PublicWorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSkillDetails = (name: string) => {
    return router.push(`/worker/${workerProfileIdToView}/profile/skills/${name}`);
  }

  useEffect(() => {
    if (workerProfileIdToView) {
      setIsLoadingProfile(true);
    } else {
      setError("Worker ID missing.");
      setIsLoadingProfile(false);
    }
  }, [workerProfileIdToView]);

  if (loadingAuth || isLoadingProfile) {
    return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Profile...</div>;
  }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  if (!workerProfile) {
    return <div className={styles.pageWrapper}><p className={styles.emptyState}>Worker profile not available.</p></div>;
  }

  return (
    <div className={styles.profilePageContainer}>      
      <CloseButton />
      <WorkerProfile workerProfile={workerProfile} isSelfView={false} handleSkillDetails={handleSkillDetails}/>
      {/* --- Footer Action Bar (from first "Benji" image) --- */}
      
    <HireButton workerName={user?.displayName || ""} workerId={workerProfile.id || "1"} />
    </div> // End Profile Page Container
  );
} 