"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SkillSplashScreen from "@/app/components/profile/SkillSplashScreen";
import { getSkillDetailsWorker } from "@/actions/user/gig-worker-profile";
import { Star as DefaultBadgeIcon } from "lucide-react";
import { SkillProfile } from "./schemas/skillProfile";

export default function WorkerSkillDetailPage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [profile, setProfile] = useState<SkillProfile | null>(null);

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

    fetchSkillData();
  }, [skillId]);

  return <SkillSplashScreen profile={profile} />;
}
