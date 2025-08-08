"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { UserCircle } from "lucide-react";
import styles from "./page.module.css";
import WorkerProfile from "@/app/components/profile/WorkerProfile";
import CloseButton from "@/app/components/profile/CloseButton";
import { useAuth, User } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";
import {
  getGigWorkerProfile,
} from "@/actions/user/gig-worker-profile";

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
  const isSelfView = true;

  const fetchUserProfile = (user: User) => {
        setLoadingProfile(true);
        getGigWorkerProfile(user.token)
          .then((data) => {
            setProfile(data.data);
            setError(null);
          })
          .catch((err) => {
            console.error("Failed to fetch worker profile:", err);
            setError("Could not load your profile.");
          })
          .finally(() => setLoadingProfile(false));
  }

  useEffect(() => {
    if (!loadingAuth && user) {
      if (lastRoleUsed === "GIG_WORKER" || user.claims.role === "QA") {
        fetchUserProfile(user)
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
        {/* Using a generic Loader2 for now, ensure it's imported or replace with appropriate loader */}
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
    <div className={styles.profilePageContainer}>
      <CloseButton />
      <WorkerProfile
        workerProfile={profile}
        isSelfView={isSelfView}
        handleAddSkill={() => {}}
        handleSkillDetails={handleSkillDetails}
        fetchUserProfile={fetchUserProfile}
      />
    </div>
  );
}
