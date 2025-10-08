"use client";

import styles from "./WorkerProfile.module.css";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";
import VideoSection from "./VideoSection";
import LocationSection from "./LocationSection";

interface ProfileMediaProps {
  workerProfile: PublicWorkerProfile;
  isSelfView: boolean;
  workerLink: string | null;
  updateVideoUrlProfileAction: (url: string, token: string) => Promise<{ success: boolean; data: string | null; error?: unknown }>;
  fetchUserProfile: (token: string) => void;
}

export default function ProfileMedia({
  workerProfile,
  isSelfView,
  workerLink,
  updateVideoUrlProfileAction,
  fetchUserProfile,
}: ProfileMediaProps) {
  return (
    <div className={styles.profileHeaderImageSection}>
      <VideoSection
        videoUrl={workerProfile?.videoUrl}
        isSelfView={isSelfView}
        updateVideoUrlProfileAction={updateVideoUrlProfileAction}
        fetchUserProfile={fetchUserProfile}
      />
      <LocationSection
        workerProfile={workerProfile}
        isSelfView={isSelfView}
        workerLink={workerLink}
      />
    </div>
  );
}
