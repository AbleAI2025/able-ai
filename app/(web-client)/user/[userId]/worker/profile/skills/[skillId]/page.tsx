"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SkillSplashScreen from "@/app/components/profile/SkillSplashScreen";
import { getSkillDetailsWorker } from "@/actions/user/gig-worker-profile";
import { SkillProfile } from "./schemas/skillProfile";
import { mockSkillProfile } from "./mockSkillProfile";
import Loader from "@/app/components/shared/Loader";

export default function WorkerSkillDetailPage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const router = useRouter();

  const isViewQA = false;

  const fetchSkillData = async () => {
    if (!skillId) return;
    if (isViewQA) {
      setProfile(mockSkillProfile);
      return;
    }
    try {
      const { success, data } = await getSkillDetailsWorker(skillId);
      if (success && data) {
        // Fallback icon if not present
        const updatedBadges = (data.badges ?? []).map((badge: any) => ({
          ...badge,
          icon: badge.icon,
        }));

        const updatedRecommendations = (data.recommendations ?? []).map(
          (rec: any) => ({
            ...rec,
            date: rec.date
              ? new Date(rec.date).toISOString().split("T")[0] // "YYYY-MM-DD"
              : null,
          })
        );

        const normalizedStatistics = {
          reviews: Number(data?.statistics?.reviews ?? 0), // siempre number
          paymentsCollected: String(data?.statistics?.paymentsCollected ?? "0"), // si SkillProfile espera string
          tipsReceived: String(data?.statistics?.tipsReceived ?? "0"),
        };

        setProfile({
          ...data,
          workerProfileId: skillId,
          badges: updatedBadges,
          qualifications: data?.qualifications ?? [],
          recommendations: updatedRecommendations,
          statistics: normalizedStatistics,

        });
      }
    } catch (error) {
      console.error("Error fetching skill profile:", error);
    }
  };

  useEffect(() => {
    fetchSkillData();
  }, [skillId]);

  if (!profile) return <Loader />;

  return (
    <SkillSplashScreen
      skillId={skillId}
      profile={profile}
      fetchSkillData={fetchSkillData}
      isSelfView={true}
      onBackClick={() => router.back()}
    />
  );
}
