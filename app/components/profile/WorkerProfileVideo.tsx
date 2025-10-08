"use client";

import { useState } from "react";
import Link from "next/link";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import styles from "./WorkerProfileVideo.module.css";
import { MonitorPlay, Pencil, VideoOff } from "lucide-react";

interface ProfileVideoProps {
  videoUrl?: string | null;
  isSelfView: boolean;
  onVideoUpload: (file: Blob) => void;
}

export default function ProfileVideo({
  videoUrl,
  isSelfView,
  onVideoUpload,
}: ProfileVideoProps) {
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  // 🎥 Empty state (no video uploaded yet)
  if (!videoUrl && !isEditingVideo) {
    return isSelfView ? (
      <div className={styles.emptyContainer}>
        <h3>Please, introduce yourself</h3>
        <VideoRecorderBubble
          key={1}
          onVideoRecorded={onVideoUpload}
          setIsEditingVideo={setIsEditingVideo}
          isCancelButtonVisible={false}
        />
      </div>
    ) : (
      <>
        <p>
          <VideoOff />
        </p>
        <p className={styles.emptyMessage}>
          The user has not submitted the presentation
        </p>
      </>
    );
  }

  // 🎥 Show recorder if editing
  if (isEditingVideo) {
    return (
      <div className={styles.recorderWrapper}>
        <VideoRecorderBubble
          key={2}
          onVideoRecorded={(video) => {
            onVideoUpload(video);
            setIsEditingVideo(false);
          }}
          setIsEditingVideo={setIsEditingVideo}
        />
      </div>
    );
  }

  // 🎥 Show existing video
  return (
    <div className={styles.videoWrapper}>
      <Link
        href={videoUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.videoLink}
      >
        <video key={videoUrl} className={styles.videoPlayer} preload="metadata" muted>
          <source src={videoUrl! + "#t=0.1"} type="video/webm" />
        </video>
        {videoUrl && (
          <MonitorPlay color="#fff" size={50} className={styles.monitorPlay} />
        )}
      </Link>
      {isSelfView && videoUrl && (
        <button
          onClick={() => setIsEditingVideo(true)}
          className={styles.editIconButton}
          aria-label="Edit video"
        >
          <Pencil size={18} />
        </button>
      )}
    </div>
  );
}
