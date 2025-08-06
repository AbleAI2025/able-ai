"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './SkillSpecificPage.module.css';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';
import { getSkillDetailsWorker } from '@/actions/user/gig-worker-profile';
import { Star as DefaultBadgeIcon } from "lucide-react";

export type Profile = {
  name: string;
  title: string;
  hashtags: string;
  customerReviewsText: string;
  ableGigs: number;
  experienceYears: number;
  Eph: number;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  statistics: {
    reviews: number;
    paymentsCollected: string;
    tipsReceived: string;
  };
  supportingImages: string[];
  badges: {
    id: string | number;
    icon: React.ElementType;
    textLines: string[] | string;
  }[];
  qualifications: {
    name: string;
    date: string;
    text: string;
  }[];
  buyerReviews: {
    name: string;
    date: string;
    text: string;
  }[];
  recommendation?: {
    name: string;
    date: string;
    text: string;
  };
};

// --- COMPONENT ---
export default function PublicSkillProfilePage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchSkillData = async () => {
      if (!skillId) return;
      try {
        const { success, data } = await getSkillDetailsWorker(skillId);
        if (success && data) {
          // Fallback icon if not present
          const updatedBadges = (data.badges ?? []).map((badge: any) => ({
            ...badge,
            icon: badge.icon || DefaultBadgeIcon,
          }));
          setProfile({ ...data, badges: updatedBadges });
        }
      } catch (error) {
        console.error("Error fetching skill profile:", error);
      }
    };

    fetchSkillData();
  }, [skillId]);

  return (
    <div className={styles.skillPageContainer}>
      <CloseButton />
      <SkillSplashScreen profile={profile} skillId={skillId}/>
      <HireButton workerId={skillId} workerName={profile?.name} />
    </div> 
  );
} 