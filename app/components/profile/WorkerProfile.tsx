/* eslint-disable max-lines-per-function */
"use client";
import Link from "next/link";

// --- SHARED & HELPER COMPONENTS ---
import SkillsDisplayTable from "@/app/components/profile/SkillsDisplayTable";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import styles from "./WorkerProfile.module.css";

import {
  CalendarDays,
  BadgeCheck,
  ThumbsUp,
  MessageSquare,
  Edit2,
} from "lucide-react";
import {
  getPrivateWorkerProfileAction,
  updateVideoUrlProfileAction,
} from "@/actions/user/gig-worker-profile";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

import PublicWorkerProfile, {
  Equipment,
  Qualification,
  Review,
} from "@/app/types/workerProfileTypes";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileMedia from "./ProfileMedia";
import CancelButton from "../shared/CancelButton";
import { BadgeIcon } from "./GetBadgeIcon";
import Qualifications from "./Qualifications";
import Equipments from "./Equipments";
import UserNameModal from "./UserNameModal";

const WorkerProfile = ({
  workerProfile,
  isSelfView = false,
  handleAddSkill,
  handleSkillDetails, // Optional handler for skill details
  fetchUserProfile,
}: {
  workerProfile: PublicWorkerProfile;
  handleAddSkill?: (id: string) => void;
  handleSkillDetails: (id: string) => void; // Now optional
  fetchUserProfile: (id: string) => void;
  userId?: string;
  isSelfView: boolean;
}) => {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [workerLink, setWorkerLink] = useState<string | null>(null);
  const [showRtwPopup, setShowRtwPopup] = useState(false);

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

  useEffect(() => {
    if (workerProfile && workerProfile.id) {
      setWorkerLink(
        `${window.location.origin}/worker/${workerProfile.id}/profile`
      );
    }
  }, [workerProfile]);

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={styles.profilePageContainer}>
      {/* Top Section (Benji Image Style - Profile Image/Video, QR, Location) */}
      <ProfileMedia
        workerProfile={workerProfile}
        isSelfView={isSelfView}
        workerLink={workerLink}
        onVideoUpload={handleVideoUpload}
      />
      {/* User Info Bar (Benji Image Style - Name, Handle, Calendar) */}
      <div className={styles.userInfoBar}>
        <div className={styles.userInfo}>
          <h1 className={styles.workerName}>
            <span>
              {workerProfile.user?.fullName ?? ""}
            </span>
            {isSelfView && (
              <button 
                className={styles.editButton} 
                type="button" 
                aria-label="Edit name"
                onClick={() => setIsOpen(true)}
              >
                <Edit2
                  size={16}
                  color="#ffffff"
                  className={styles.icon}
                />
              </button>
            )}
          </h1>
          
          {workerProfile?.user?.rtwStatus === "ACCEPTED" ? (
            <div className={styles.verifiedBadgeContainer}>
              <BadgeCheck size={25} className={styles.verifiedBadgeWorker} />
              <span className={styles.verifiedText}>
                Right to work verified
              </span>
            </div>
          ) : isSelfView ? (
            <button
              type="button"
              className={styles.verifyRTWButton}
              onClick={() => setShowRtwPopup(true)}
            >
              Verify your right to work
            </button>
          ) : (
            <span className={styles.verifiedText}>
              Right to work not verified
            </span>
          )}
        </div>
        <div className={styles.workerInfo}>
          {true && (
            <Link
              href={isSelfView ? "calendar" : `/user/${workerProfile.userId}/worker/${workerProfile.id}/availability`}
              className={`${styles.viewCalendarLink} ${styles.rightMargin}`}
              aria-label="View calendar"
            >
              <CalendarDays size={28} className={styles.calendarIcon} />
              <span>{isSelfView ? "View calendar" : "Availability calendar"}</span>
            </Link>
          )}
        </div>
      </div>
      {/* Main content wrapper */}
      <div className={styles.mainContentWrapper}>
        {/* Statistics Section */}
        <div>
          <h3 className={styles.contentTitle}>Statistics</h3>
          <div className={styles.statisticsItemsContainer}>
            <StatisticItemDisplay
              stat={{
                id: 1,
                icon: ThumbsUp,
                value: workerProfile?.responseRateInternal || 0,
                label: `Would work with ${
                  workerProfile?.user?.fullName?.split(" ")?.[0] ?? ""
                } again`,
                iconColor: "#41a1e8",
              }}
            />

            <StatisticItemDisplay
              stat={{
                id: 2,
                icon: MessageSquare,
                value: workerProfile?.averageRating || 0,
                label: "Response rate",
                iconColor: "#41a1e8",
              }}
            />
          </div>
        </div>

        {/* Skills Section (User Image Style - Blue Card) */}
        {
          <SkillsDisplayTable
            skills={workerProfile?.skills}
            isSelfView={isSelfView}
            handleSkillDetails={handleSkillDetails}
            fetchUserProfile={fetchUserProfile}
            token={user?.token || ""}
          />
        }

        {/* Awards & Feedback Section (User Image Style) */}
        {workerProfile.awards && ( // Only show section if there are awards or feedback
          <div className={styles.awardsFeedbackGrid}>
            {workerProfile.awards && workerProfile.awards.length > 0 && (
              <div>
                <h3 className={styles.contentTitle}>Awards:</h3>
                <div className={styles.awardsContainer}>
                  {workerProfile.awards.map((award) => (
                    <AwardDisplayBadge
                      icon={award.icon as BadgeIcon}
                      key={award.id}
                      title={award.name}
                      role="worker"
                      type={award.type}
                    />
                  ))}
                </div>
              </div>
            )}
            <div>
              <h3 className={styles.contentTitle}>Feedback</h3>
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

        {/* Qualifications Section (User Image Style) */}
        <Qualifications
          qualifications={
            (workerProfile.qualifications as Qualification[]) ?? []
          }
          workerId={workerProfile.id}
          isSelfView={isSelfView}
          fetchUserProfile={fetchUserProfile}
        />

        {/* Equipment Section (User Image Style) */}
        {
          <Equipments
            workerProfileId={workerProfile.id}
            equipments={(workerProfile.equipment as Equipment[]) ?? []}
            isSelfView={isSelfView}
            fetchUserProfile={fetchUserProfile}
          />
        }
      </div>
      {/* End Main Content Wrapper */}
      {/* RTW Verification Popup */}

      {showRtwPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <div className={styles.title}>
              To adhere to UK law, we need to confirm you have the legal right
              to work.
            </div>
            <div className={styles.title}>Are you a</div>

            <div className={styles.buttons}>
              <button
                className={styles.button}
                onClick={() => setShowRtwPopup(false)}
              >
                UK national
              </button>
              <span className={styles.orText}>Or</span>
              <button
                className={styles.button}
                onClick={() =>
                  (window.location.href =
                    "/user/A3BDfET6iPbY0zYHUTaIU0sMucF3/worker/rtw")
                }
              >
                Non UK national
              </button>
            </div>

            <CancelButton handleCancel={() => setShowRtwPopup(false)} />
          </div>
        </div>
      )}
      {/* Edit Name Modal */}
      {isOpen && (
        <UserNameModal
          userId={workerProfile.id || ""}
          initialValue={workerProfile.user?.fullName ?? ""}
          fetchUserProfile={fetchUserProfile}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default WorkerProfile;
