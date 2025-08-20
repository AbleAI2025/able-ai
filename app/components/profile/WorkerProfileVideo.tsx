// app/components/profile/ProfileVideo.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";

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

  if (!videoUrl) {
    return isSelfView ? (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <h3>Please, introduce yourself</h3>
        <VideoRecorderBubble key={1} onVideoRecorded={onVideoUpload} />
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
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <Link
        href={videoUrl}
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
          <source src={videoUrl + "#t=0.1"} type="video/webm" />
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
  );
}
