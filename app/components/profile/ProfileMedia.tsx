// app/components/profile/ProfileMedia.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import QRCodeDisplay from "./QrCodeDisplay";
import { MapPin, Share2 } from "lucide-react";
import { toast } from "sonner";
import styles from "./WorkerProfile.module.css";

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
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  return (
    <div className={styles.profileHeaderImageSection}>
      <div className={styles.profileImageVideo}>
        {!workerProfile?.videoUrl ? (
          isSelfView ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <h3>Please, introduce yourself</h3>
              <VideoRecorderBubble
                key={1}
                onVideoRecorded={onVideoUpload}
              />
            </div>
          ) : (
            <p
              style={{
                textAlign: "center",
                fontStyle: "italic",
                color: "#888",
              }}
            >
              User presentation not exist
            </p>
          )
        ) : (
          <div style={{ textAlign: "center" }}>
            <Link
              href={workerProfile.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              <video
                width="180"
                height="180"
                style={{ borderRadius: "8px", objectFit: "cover" }}
                preload="metadata"
                muted
                poster="/video-placeholder.jpg"
              >
                <source
                  src={workerProfile.videoUrl + "#t=0.1"}
                  type="video/webm"
                />
              </video>
            </Link>

            {isSelfView && (
              <div style={{ marginTop: "8px" }}>
                <button
                  onClick={() => setIsEditingVideo(true)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#0070f3",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  Edit video
                </button>
              </div>
            )}

            {isEditingVideo && (
              <div style={{ marginTop: "12px" }}>
                <VideoRecorderBubble
                  key={2}
                  onVideoRecorded={(video) => {
                    onVideoUpload(video);
                    setIsEditingVideo(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
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
            <Share2 size={33} color="#ffffff" />
          </button>
        </div>
      </div>
    </div>
  );
}
