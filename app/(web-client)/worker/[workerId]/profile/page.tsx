"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

import {
  Award as AwardIconLucide, UserCircle, Loader2, ThumbsUp, MessageCircleCode } from 'lucide-react';
import styles from './page.module.css'; // Use page.module.css
import WorkerProfile from '@/app/components/profile/WorkerProfile';

// --- INTERFACE (Adapted for image elements) ---
import PublicWorkerProfile from '@/app/types/workerProfileTypes';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';
import { useAuth } from '@/context/AuthContext';

// --- MOCK FUNCTION (Updated with new data points) ---
async function fetchPublicWorkerProfile(workerIdToView: string): Promise<PublicWorkerProfile | null> {
  console.log("Fetching public profile for worker:", workerIdToView);
  await new Promise(resolve => setTimeout(resolve, 700));
  if (workerIdToView === "benji-asamoah-id") {
    return {
      id: "benji-asamoah-id",
      displayName: "Benji Asamoah",
      userHandle: "@benjiasamoah",
      profileHeadline: "Expert Mixologist & Event Bartender",
      avatarUrl: "/images/avatar-benji.jpg",
      profileImageUrl: "/images/benji.jpeg",
      qrCodeUrl: "/images/qr.svg",
      location: "Streatham, London",
      isVerified: true,
      viewCalendarLink: "#view-calendar",

      statistics: [
        { id: "s1", icon: ThumbsUp, value: "100%", label: "Would work with Benji again" },
        { id: "s2", icon: MessageCircleCode, value: "100%", label: "Response rate" },
      ],
      skills: [
        { name: "Bartender", ableGigs: 15, experience: "3 years", eph: 15 },
        { name: "Waiter", ableGigs: 2, experience: "8 years", eph: 15 },
        { name: "Graphic Designer", ableGigs: 1, experience: "7 years", eph: 22 }
      ],
      awards: [
        { id: "a1", icon: AwardIconLucide, textLines: "Always on time" },
        { id: "a2", icon: UserCircle, textLines: "Able Professional" },
      ],
      feedbackSummary: "Professional, charming and lively",
      qualifications: [
        "Bachelor's Degree in Graphic Design",
        "Licensed bar manager",
        "Drivers license",
      ],
      equipment: [
        "Camera gear", "Laptop", "Smartphone", "Uniform", "Bicycle", "Car"
      ],
    };
  }
  return null;
}

// --- COMPONENT ---
export default function PublicWorkerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerProfileIdToView = params.workerId as string;

  const { loading: loadingAuth } = useAuth();

  const [workerProfile, setWorkerProfile] = useState<PublicWorkerProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSkillDetails = (name: string) => {
    return router.push(`/worker/${workerProfileIdToView}/profile/skills/${name}`);
  }

  useEffect(() => {
    if (workerProfileIdToView) {
      setIsLoadingProfile(true);
      fetchPublicWorkerProfile(workerProfileIdToView)
        .then(data => {
          if (data) setWorkerProfile(data);
          else setError("Worker profile not found.");
        })
        .catch(err => {
          console.error("Error loading worker profile:", err);
          setError("Could not load worker profile.");
        })
        .finally(() => setIsLoadingProfile(false));
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
      
    <HireButton workerName={workerProfile.displayName} workerId={workerProfile.id} />
    </div> // End Profile Page Container
  );
} 