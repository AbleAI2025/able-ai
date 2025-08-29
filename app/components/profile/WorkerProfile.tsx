/* eslint-disable max-lines-per-function */
"use client";
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
  ThumbsUp,
  MessageSquare,
  Trophy,
  Star,
  Flag,
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

import PublicWorkerProfile, { Review } from "@/app/types/workerProfileTypes";
import { useAuth } from "@/context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import ProfileMedia from "./ProfileMedia";
import CancelButton from "../shared/CancelButton";

const WorkerProfile = ({
  workerProfile,
  isSelfView = false,
  handleAddSkill,
  handleSkillDetails, // Optional handler for skill details
  fetchUserProfile,
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
  const [workerLink, setWorkerLink] = useState<string | null>(null);
  const [showRtwPopup, setShowRtwPopup] = useState(false);

  const isWorkerVerified = false;

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

  // const getIconFromAwardName = (awardName: string) => {
  //   switch (awardName) {
  //     case "Alpha Gigee":
  //     case "Gig Pioneer":
  //       return Flag;
  //     case "First gig complete":
  //       return ;
  //     case "Golden Vibes":
  //     case "Fairy Play":
  //     case "Heart Mode":
  //       return Flame;
  //     case "Host with the most":
  //       return Users;
  //     case "Foam-Art Phenom":
  //       return Coffee;
  //     case "First impressions pro":
  //       return ClipboardCheck;
  //     case "Event setup hero":
  //       return Briefcase;
  //     case "Cash & till stylin'":
  //       return DollarSign;
  //     case "Customer Favourite":
  //       return ShoppingBag;
  //     case "Squad Recruiter":
  //       return UserCheck;
  //     case "Safe-guard GOAT":
  //       return Shield;
  //     case "Sparkle Mode":
  //       return Sparkles;
  //     case "Mixology Master":
  //       return Martini;
  //     case "Start Bartender":
  //       return Beer;
  //     case "Tray Jedi":
  //       return Handshake;
  //     case "Top Chef":
  //       return Utensils;
  //     default:
  //       return undefined; // ✅ safe fallback
  //   }
  // };

  useEffect(() => {
    if (workerProfile && workerProfile.id) {
      setWorkerLink(
        `${window.location.origin}/worker/${workerProfile.id}/profile`
      );
    }
  }, [workerProfile]);

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
            {user?.displayName}
          </h1>
          {isWorkerVerified ? (
            <div className={styles.verifiedBadgeContainer}>
              <BadgeCheck size={25} className={styles.verifiedBadgeWorker} />
              <span className={styles.verifiedText}>Right to work verified</span>
            </div>
          ) : (
            isSelfView ? (
              <button
                type="button"
                className={styles.verifyRTWButton}
                onClick={() => setShowRtwPopup(true)}
              >
              Verify your right to work
            </button>
            ) :(
              <span className={styles.verifiedText}>Right to work not verified</span>
            )
          )}
        </div>
        <div className={styles.workerInfo}>
          {true && (
            <Link
              href={workerProfile?.userId || ""}
              className={styles.viewCalendarLink}
              aria-label="View calendar"
            >
              <CalendarDays size={28} className={styles.calendarIcon} />
              <span>Availability calendar</span>
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
            {workerProfile?.responseRateInternal && (
              <StatisticItemDisplay
                stat={{
                  id: 1,
                    icon: ThumbsUp,
                    value: workerProfile.responseRateInternal,
                    label: `Would work with ${user?.displayName?.split(" ")[0]} again`,
                    iconColor: "#41a1e8",
                  }}
                />
              )}
              {workerProfile?.averageRating !== null &&
                workerProfile?.averageRating !== undefined && (
                  <StatisticItemDisplay
                    stat={{
                      id: 2,
                      icon: MessageSquare,
                      value: workerProfile.averageRating,
                      label: "Response rate",
                      iconColor: "#41a1e8",
                  }}
                />
              )}
            </div>
        </div>
       

        {/* Skills Section (Benji Image Style - Blue Card) */}
        {
          <SkillsDisplayTable
            skills={workerProfile?.skills}
            isSelfView={isSelfView}
            handleAddSkill={handleAddSkill}
            handleSkillDetails={handleSkillDetails}
            fetchUserProfile={fetchUserProfile}
            token={user?.token || ""}
          />
        }

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
                      // icon={getIconFromAwardName(award.badgeId)}
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
      </div>
      {/* End Main Content Wrapper */}
       {/* RTW Verification Popup */}
     

      {showRtwPopup && (
        <div className={styles.overlay}>
          <div className={styles.popup}>
            <div className={styles.title}>
              To adhere to UK law, we need to confirm you have the legal right to work.
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

    </div>

    
  );
};

export default WorkerProfile;
