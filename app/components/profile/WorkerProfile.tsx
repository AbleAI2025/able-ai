"use client";
import Image from "next/image";
import Link from "next/link";

// --- SHARED & HELPER COMPONENTS ---
import ContentCard from "@/app/components/shared/ContentCard";
import SkillsDisplayTable from "@/app/components/profile/SkillsDisplayTable";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import CheckboxDisplayItem from "@/app/components/profile/CheckboxDisplayItem";
import styles from "./WorkerProfile.module.css";

import {
  CalendarDays,
  BadgeCheck,
  MapPin,
  Share2,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";
import {
  getPrivateWorkerProfileAction,
  updateVideoUrlProfileAction,
} from "@/actions/user/gig-worker-profile";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import PublicWorkerProfile, { Review } from "@/app/types/workerProfileTypes";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const WorkerProfile = ({
  workerProfile,
  isSelfView = false,
  handleAddSkill,
  handleSkillDetails, // Optional handler for skill details
  fetchUserProfile
}: {
  workerProfile: PublicWorkerProfile;
  handleAddSkill?: () => void;
  handleSkillDetails: (id: string) => void; // Now optional
  fetchUserProfile: (token: string) => void;
  userId?: string;
  isSelfView: boolean;
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isEditingVideo, setIsEditingVideo] = useState(false);

  const handleVideoUpload = useCallback(
    async (file: Blob) => {
      if (!user) {
        console.error("Missing required parameters for video upload");
        setError("Failed to upload video. Please try again.");
        return;
      }

      if (!file || file.size === 0) {
        console.error("Invalid file for video upload");
        setError("Invalid video file. Please try again.");
        return;
      }

      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("Video file too large. Please use a file smaller than 50MB.");
        return;
      }

      try {
        const filePath = `workers/${
          user.uid
        }/introVideo/introduction-${encodeURI(user.email ?? user.uid)}.webm`;
        const fileStorageRef = storageRef(getStorage(firebaseApp), filePath);
        const uploadTask = uploadBytesResumable(fileStorageRef, file);

        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            // Progress handling if needed
          },
          (error) => {
            console.error("Upload failed:", error);
            setError("Video upload failed. Please try again.");
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((downloadURL) => {
                updateVideoUrlProfileAction(downloadURL, user.token);
                toast.success("Video upload successfully");
                getPrivateWorkerProfileAction(user.token);
              })
              .catch((error) => {
                console.error("Failed to get download URL:", error);
                setError("Failed to get video URL. Please try again.");
              });
          }
        );
      } catch (error) {
        console.error("Video upload error:", error);
        setError("Failed to upload video. Please try again.");
      }
    },
    [user]
  );
  return (
    <div className={styles.profilePageContainer}>
      {/* Top Section (Benji Image Style - Profile Image/Video, QR, Location) */}
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
                  onVideoRecorded={handleVideoUpload}
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
              {/* Video with link */}
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

              {/* Record video link */}
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

              {/* Show video recorder */}
              {isEditingVideo && (
                <div style={{ marginTop: "12px" }}>
                  <VideoRecorderBubble
                    key={2}
                    onVideoRecorded={(video) => {
                      handleVideoUpload(video);
                      setIsEditingVideo(false);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Add play icon if it's a video */}
        </div>
        <div className={styles.profileHeaderRightCol}>
          {true && (
            <Image
              src={"/default-avatar.png"}
              alt="QR Code"
              width={90}
              height={90}
              className={styles.qrCode}
            />
          )}
          <div className={styles.locationShareContainer}>
            {workerProfile && workerProfile.location && (
              <div className={styles.locationInfo}>
                <MapPin size={16} color="#ffffff" className={styles.mapPin} />
                <span>{workerProfile.location}</span>
              </div>
            )}
            <button
              className={styles.shareProfileButton}
              aria-label="Share profile"
              onClick={() =>
                alert(
                  `${window.location.origin}/worker/${workerProfile.id}/profile`
                )
              }
            >
              <Share2 size={33} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>
      {/* User Info Bar (Benji Image Style - Name, Handle, Calendar) */}
      <div className={styles.userInfoBar}>
        <div className={styles.userInfoLeft}>
          <h1 className={styles.workerName}>
            {user?.displayName}
            {true && (
              <BadgeCheck size={22} className={styles.verifiedBadgeWorker} />
            )}
          </h1>
        </div>
        <div className={styles.workerInfo}>
          {true && (
            <Link
              href={workerProfile?.userId || ""}
              className={styles.viewCalendarLink}
              aria-label="View calendar"
            >
              <CalendarDays size={20} className={styles.calendarIcon} />
              <span>Availability calendar</span>
            </Link>
          )}
        </div>
      </div>
      {/* Main content wrapper */}
      <div className={styles.mainContentWrapper}>
        {/* Statistics Section (Benji Image Style) */}
        <ContentCard title="Statistics" className={styles.statisticsCard}>
          <div className={styles.statisticsItemsContainer}>
            {workerProfile?.responseRateInternal && (
              <StatisticItemDisplay
                stat={{
                  id: 1,
                  icon: ThumbsUp,
                  value: workerProfile.responseRateInternal,
                  label: "Would work with Benji again",
                  iconColor: "#0070f3",
                }}
              />
            )}
            {workerProfile?.averageRating && (
              <StatisticItemDisplay
                stat={{
                  id: 2,
                  icon: MessageSquare,
                  value: workerProfile.averageRating,
                  label: "Response rate",
                  iconColor: "#0070f3",
                }}
              />
            )}
          </div>
        </ContentCard>

        {/* Skills Section (Benji Image Style - Blue Card) */}
        { (
          <SkillsDisplayTable
            skills={workerProfile?.skills}
            isSelfView={isSelfView}
            handleAddSkill={handleAddSkill}
            handleSkillDetails={handleSkillDetails}
            fetchUserProfile={fetchUserProfile}
            token={user?.token || ""}
          />
        )}

        {/* Awards & Feedback Section (Benji Image Style) */}
        {workerProfile.awards && ( // Only show section if there are awards or feedback
          <div className={styles.awardsFeedbackGrid}>
            {workerProfile.awards && workerProfile.awards.length > 0 && (
              // <ContentCard title="Awards:" className={styles.awardsCard}>
              <div>
                <h3 className={styles.contentTitle}>Awards:</h3>
                <div className={styles.awardsContainer}>
                  {workerProfile.awards.map((award) => (
                    <AwardDisplayBadge
                      key={award.id}
                      textLines={award.notes || ""}
                      color="#eab308"
                      border="3px solid #eab308"
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className={styles.contentTitle}>Feedbacks:</h3>
              {workerProfile.reviews && workerProfile.reviews.length > 0 ? (
                workerProfile.reviews.map((review: Review) => (
                  <p key={review.id} className={styles.feedbackText}>
                    {review.comment}
                  </p>
                ))
              ) : (
                <p className={styles.feedbackText}>No feedback available.</p>
              )}
            </div>
          </div>
        )}

        {/* Qualifications Section (Benji Image Style) */}
        {workerProfile.qualifications &&
          workerProfile.qualifications.length > 0 && (
            // <ContentCard title="Qualifications:">
            <div>
              <h3 className={styles.contentTitle}>Qualifications:</h3>
              <ul className={styles.listSimple}>
                {workerProfile.qualifications.map((q, index) => (
                  <li key={index}>
                    {q.title}: {q.description}
                  </li>
                ))}
              </ul>
            </div>
            // </ContentCard>
          )}

        {/* Equipment Section (Benji Image Style) */}
        {workerProfile.equipment && workerProfile.equipment.length > 0 && (
          <div>
            <h3 className={styles.contentTitle}>Equipment:</h3>
            <div className={styles.equipmentListContainer}>
              {workerProfile.equipment.map((item, index) => (
                <CheckboxDisplayItem key={index} label={item.name} />
              ))}
            </div>
          </div>
        )}

        {/* Bio Text (if used) */}
        {workerProfile.fullBio && (
          <ContentCard
            title={`About ${user?.displayName?.split(" ")[0] || "this user"}`}
          >
            <p className={styles.bioText}>{workerProfile.fullBio}</p>
          </ContentCard>
        )}
      </div>{" "}
      {/* End Main Content Wrapper */}
    </div>
  );
};

export default WorkerProfile;
