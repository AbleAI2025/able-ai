"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import ProfileVideo from "./WorkerProfileVideo";
import styles from "./WorkerProfile.module.css";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { useAuth } from "@/context/AuthContext";

interface VideoSectionProps {
  videoUrl?: string | null;
  isSelfView: boolean;
  updateVideoUrlProfileAction: (url: string, token: string) => Promise<{ success: boolean; data: string; error?: unknown }>;
  fetchUserProfile: (token: string) => void;
}

export default function VideoSection({
  videoUrl,
  isSelfView,
  updateVideoUrlProfileAction,
  fetchUserProfile,
}: VideoSectionProps) {
  const { user } = useAuth();

  const handleVideoUpload = useCallback(
    async (file: Blob) => {
      if (!user) {
        console.error("Missing required parameters for video upload");
        toast.error("Failed to upload video. Please try again.");
        return;
      }

      if (!file || file.size === 0) {
        console.error("Invalid file for video upload");
        toast.error("Invalid video file. Please try again.");
        return;
      }

      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(
          "Video file too large. Please use a file smaller than 50MB."
        );
        return;
      }

      try {
        const filePath = `workers/${
          user.uid
        }/introVideo/introduction-${encodeURI(user.email ?? user.uid)}.webm`;
        const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        const toastId = toast.loading("Uploading video...");

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            toast.loading(`Uploading: ${Math.round(progress)}%`, { id: toastId });
          },
          (error) => {
            console.error("Upload failed:", error);
            toast.error("Video upload failed. Please try again.", { id: toastId });
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                updateVideoUrlProfileAction(downloadURL, user.token);
                toast.success("Video upload successful", { id: toastId });
                fetchUserProfile(user.token);
              })
              .catch((error) => {
                console.error("Failed to get download URL:", error);
                toast.error("Failed to get video URL. Please try again.", { id: toastId });
              });
          }
        );
      } catch (error) {
        console.error("Video upload error:", error);
        toast.error("Failed to upload video. Please try again.");
      }
    },
    [user, updateVideoUrlProfileAction, fetchUserProfile]
  );

  return (
    <div className={styles.profileImageVideo}>
      <ProfileVideo
        videoUrl={videoUrl}
        isSelfView={isSelfView}
        onVideoUpload={handleVideoUpload}
      />
    </div>
  );
}