"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import styles from "./SkillSpecificPage.module.css";
import SkillSplashScreen from "@/app/components/profile/SkillSplashScreen";
import CloseButton from "@/app/components/profile/CloseButton";
import HireButton from "@/app/components/profile/HireButton";
import { getSkillDetailsWorker } from "@/actions/user/gig-worker-profile";
import { SkillProfile } from "@/app/(web-client)/user/[userId]/worker/profile/skills/[skillId]/schemas/skillProfile";
import Loader from "@/app/components/shared/Loader";

// --- COMPONENT ---
export default function PublicSkillProfilePage() {
  const params = useParams();
  const skillId = params?.skillId as string;
  const [skill, setSkill] = useState<SkillProfile | null>(null);
  const router = useRouter();

  const fetchSkillData = useCallback(async () => {
    if (!skillId) return;
    try {
      const { success, data } = await getSkillDetailsWorker(skillId);
      if (success && data) {
        setSkill(data);
      }
    } catch (error) {
      console.error("Error fetching skill profile:", error);
    }
  }, [skillId]);

  useEffect(() => {
    fetchSkillData();
  }, [fetchSkillData]);

  if (!skill) return <Loader />;

  return (
    <div className={styles.skillPageContainer}>
      <CloseButton />
      <SkillSplashScreen
        skill={skill}
        skillId={skillId}
        fetchSkillData={fetchSkillData}
        isSelfView={false}
        onBackClick={() => router.back()}
      />
      <HireButton workerId={skillId} workerName={skill?.name} />
    </div>
  );
}
