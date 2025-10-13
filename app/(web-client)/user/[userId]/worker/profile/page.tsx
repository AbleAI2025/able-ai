"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";
import styles from "./page.module.css";
import WorkerProfile from "@/app/components/profile/WorkerProfile";
import CloseButton from "@/app/components/profile/CloseButton";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";
import StripeConnectionGuard from "@/app/components/shared/StripeConnectionGuard";

export default function WorkerOwnedProfilePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const userId = params.userId as string;
  const lastRoleUsed = getLastRoleUsed();

  const { user, loading: loadingAuth } = useAuth();

  const [profile, setProfile] = useState<
    PublicWorkerProfile | undefined | null
  >(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('/api/worker/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch profile');
      }

      const data = result.data;
      if (data) {
        setProfile(data);
        setError(null);
      } else {
        setError("Could not load your profile.");
        setProfile(null);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load your profile.");
      setProfile(null);
      router.replace(`/user/${userId}/worker/onboarding-ai`);
    }
    setLoadingProfile(false);
  }

  useEffect(() => {
    if (!loadingAuth && user) {
      if (lastRoleUsed === "GIG_WORKER") {
        fetchUserProfile(user.token);
      } else {
        router.replace("/select-role");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, user?.claims.role, userId, pathname, router, lastRoleUsed]);

  const handleSkillDetails = (id: string) => {
    return router.push(`/user/${userId}/worker/profile/skills/${id}`);
  };

  if (loadingAuth || loadingProfile) {
    return (
      <div className={styles.pageLoadingContainer}>
        <UserCircle className="animate-spin" size={48} /> Loading Profile...
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className={styles.pageWrapper}>
        <p className={styles.emptyState}>Profile not available.</p>
      </div>
    );
  }

  return (
    <StripeConnectionGuard userId={userId} redirectPath={`/user/${userId}/settings`}>
      <div className={styles.profilePageContainer}>
        <CloseButton />
        <WorkerProfile
          workerProfile={profile}
          isSelfView={true}
          handleAddSkill={() => { }}
          handleSkillDetails={handleSkillDetails}
          fetchUserProfile={fetchUserProfile}
        />
      </div>
    </StripeConnectionGuard>
  );
}
