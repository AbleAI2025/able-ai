"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import styles from './SkillSpecificPage.module.css';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';
import CloseButton from '@/app/components/profile/CloseButton';
import HireButton from '@/app/components/profile/HireButton';
import { getSkillDetailsWorker } from '@/actions/user/gig-worker-profile';
import { Star as DefaultBadgeIcon } from "lucide-react";
import { SkillProfile } from '@/app/(web-client)/user/[userId]/worker/profile/skills/[skillId]/schemas/skillProfile';



// --- COMPONENT ---
export default function PublicSkillProfilePage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [profile, setProfile] = useState<SkillProfile | null>(null);

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

          const transformedQualifications = data?.qualifications?.map((q) => ({
            title: q.title,
            date: q.yearAchieved?.toString() ?? "",
            description: q.description ?? "",
          }));

          setProfile({
            ...data,
            badges: updatedBadges,
            qualifications: transformedQualifications,
          });
        }
      } catch (error) {
        console.error("Error fetching skill profile:", error);
      }
    };

  useEffect(() => {
    fetchSkillData();
  }, [skillId]);

  return (
    <div className={styles.skillPageContainer}>
      <CloseButton />
      <SkillSplashScreen profile={profile} skillId={skillId} fetchSkillData={fetchSkillData} isSelfView={false} />
      <HireButton workerId={skillId} workerName={profile?.name} />
    </div> 
  );
} 