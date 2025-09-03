// app/components/profile/ProfileMedia.tsx
"use client";
import QRCodeDisplay from "./QrCodeDisplay";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./WorkerProfile.module.css";
import ProfileVideo from "./WorkerProfileVideo";

interface ProfileMediaProps {
  workerProfile: any;
  isSelfView: boolean;
  workerLink: string | null;
  onVideoUpload: (file: Blob) => void;
}

export default function ProfileMedia({
  workerProfile,
  isSelfView,
  workerLink,
  onVideoUpload,
}: ProfileMediaProps) {
  return (
    <div className={styles.profileHeaderImageSection}>
      <div className={styles.profileImageVideo}>
        <ProfileVideo
          videoUrl={workerProfile?.videoUrl}
          isSelfView={isSelfView}
          onVideoUpload={onVideoUpload}
        />
      </div>

      <div className={styles.profileHeaderRightCol}>
        {workerLink && <QRCodeDisplay url={workerLink} />}
        <div className={styles.locationShareContainer}>
          {workerProfile?.location && (
            <div className={styles.locationInfo}>
              <MapPin size={16} color="#ffffff" className={styles.mapPin} />
              <span>{workerProfile.location}</span>
            </div>
          )}
          <button
            className={styles.shareProfileButton}
            aria-label="Share profile"
            onClick={async () => {
              if (workerLink) {
                try {
                  await navigator.clipboard.writeText(workerLink);
                  toast.success("Profile link copied to clipboard!");
                } catch (err) {
                  console.error("Failed to copy link:", err);
                  toast.error("Failed to copy link. Please try manually.");
                }
              }
            }}
          >
            <Share2 size={25} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
}
