"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SkillSplashScreen from "@/app/components/profile/SkillSplashScreen";
import { getSkillDetailsWorker } from "@/actions/user/gig-worker-profile";
import { SkillProfile } from "./schemas/skillProfile";
import Loader from "@/app/components/shared/Loader";

export default function WorkerSkillDetailPage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const router = useRouter();

  const fetchSkillData = useCallback(async () => {
    if (!skillId) return;
    try {
      const { success, data } = await getSkillDetailsWorker(skillId);
      if (success && data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error fetching skill profile:", error);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSkillData();
  }, [fetchSkillData]);

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
