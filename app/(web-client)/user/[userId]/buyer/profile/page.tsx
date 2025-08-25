/* eslint-disable max-lines-per-function */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  ThumbsUp,
  Award,
  Loader2,
  Sparkles,
  MessageCircleCode,
} from "lucide-react";
import styles from "./BuyerProfilePage.module.css";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import PieChartComponent from "@/app/components/shared/PiChart";
import BarChartComponent from "@/app/components/shared/BarChart";
import { useAuth } from "@/context/AuthContext";
import { getGigBuyerProfileAction, updateVideoUrlBuyerProfileAction } from "@/actions/user/gig-buyer-profile";
import { firebaseApp } from "@/lib/firebase/clientApp";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { toast } from "sonner";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";
import Link from "next/link";

// Types
interface Badge {
  id: string;
  name: string;
  icon: React.ElementType;
}
interface Review {
  id: string;
  workerName: string;
  date: string;
  reviewText: string;
  rating: number;
  workerAvatarUrl?: string;
}
interface DashboardData {
  fullName: string;
  username: string;
  introVideoThumbnailUrl?: string;
  introVideoUrl?: string;
  fullCompanyName: string;
  businessLocation?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  userRoleInBusiness: string;
  videoUrl?: string;
  statistics: Array<{
    icon: React.ElementType;
    value: string;
    label: string;
  }>;
  completedHires: number;
  typesOfStaffHired: string[];
  pieChartData?: Array<{ name: string; value: number; fill: string }>;
  barChartData?: Array<{ name: string; hires: number; spend?: number }>;
  badgesEarnedByTheirWorkers: Badge[];
  reviewsFromWorkers: Review[];
}

// Mock data for QA/testing
const mockDashboardData: DashboardData = {
  fullName: "Alexander Smith",
  username: "@AlexanderS",
  introVideoThumbnailUrl: "/images/benji.jpeg",
  introVideoUrl: "https://www.youtube.com/watch?v=some_video_id",
  fullCompanyName: "Friendship Cafe and Bar",
  userRoleInBusiness: "Owner, manager",
  statistics: [
    {
      icon: ThumbsUp,
      value: "100%",
      label: "Would work with Alexandra again",
    },
    {
      icon: MessageCircleCode,
      value: "100%",
      label: "Response rate",
    },
  ],
  completedHires: 150,
  typesOfStaffHired: ["Waiters", "Bartender", "Chef"],
  pieChartData: [
    { name: "Bartenders", value: 400, fill: "#FFBB28" },
    { name: "Waiters", value: 300, fill: "#00C49F" },
    { name: "Chefs", value: 300, fill: "#0088FE" },
    { name: "Event Staff", value: 200, fill: "#FF8042" },
  ],
  barChartData: [
    { name: "Jan", hires: 10, spend: 1500 },
    { name: "Feb", hires: 12, spend: 1800 },
    { name: "Mar", hires: 15, spend: 2200 },
    { name: "Apr", hires: 13, spend: 2000 },
  ],
  badgesEarnedByTheirWorkers: [
    { id: "b1", name: "Mixology Master Hired", icon: Award },
    { id: "b2", name: "Consistent Positive Feedback", icon: ThumbsUp },
    { id: "b3", name: "Top Venue Choice", icon: Sparkles },
  ],
  reviewsFromWorkers: [
    {
      id: "rw1",
      workerName: "Benji A.",
      date: "2023-10-15",
      reviewText:
        "Alexander is a great manager, very clear with instructions and fair. Always a pleasure to work for Friendship Cafe!",
      rating: 5,
      workerAvatarUrl: "/images/benji.jpeg",
    },
    {
      id: "rw2",
      workerName: "Sarah K.",
      date: "2023-09-20",
      reviewText:
        "Professional environment and prompt payment. Would definitely work with Alexander again.",
      rating: 4,
      workerAvatarUrl: "/images/jessica.jpeg",
    },
  ],
}; // TODO: Replace with real data fetching logic

export default function BuyerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const pageUserId = params.userId as string;
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [
    error,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setError,
  ] = useState<string | null>(null);

  const fetchUserProfile = async () => {
    if (user?.claims.role === "QA") {
      setDashboardData(mockDashboardData);
      setIsLoadingData(false);
    } else {
      // TODO: Replace with real data fetching logic for non-QA users
      const {success, profile} = await getGigBuyerProfileAction(user?.token)
      console.log("profile data:", profile);
      
      if (!success) {
        setError(error || "Failed to fetch profile data");
        setIsLoadingData(false);
        setDashboardData(profile);
        return;
      } else {
        setDashboardData(profile);
        setIsLoadingData(false);
      }
    }
  };
  useEffect(() => {
    // At this point, user is authenticated and authorized for this pageUserId
    if (user) {
      // This check is somewhat redundant due to above, but keeps structure similar
      fetchUserProfile();
    }
  }, [loadingAuth, user, authUserId, pageUserId, , pathname, router]);

  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const isSelfView = authUserId === pageUserId;

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
          const filePath = `buyer/${
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
                  updateVideoUrlBuyerProfileAction(downloadURL, user.token);
                  toast.success("Video upload successfully");
                  fetchUserProfile();
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

  if (!user || isLoadingData) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={32} /> Loading Dashboard...
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }
  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>No dashboard data available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        {/* Profile Header */}
        <header className={styles.profileHeader}>
          <h3 className={styles.profileHeaderName}>
            {dashboardData.fullName}
          </h3>
          <p className={styles.profileHeaderUsername}>
            {dashboardData.username}
          </p>
        </header>

        {/* Intro & Business Card Section */}
        <section className={`${styles.section} ${styles.introBusinessCard}`}>
          <div
            className={styles.videoThumbnailContainer}
          >
            <span className={styles.videoThumbnailTitle}>Intro Video</span>
            <div className={styles.videoPlaceholderImage}>
                      {!dashboardData?.videoUrl ? (
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
            <Link
              href={dashboardData.videoUrl}
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
                  src={dashboardData.videoUrl + "#t=0.1"}
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
                    handleVideoUpload(video);
                    setIsEditingVideo(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
            </div>
          </div>
          <div className={styles.businessInfoCard}>
            <h4>Business:</h4>
            <p>
              {dashboardData.fullCompanyName}
              <br />
              {dashboardData?.businessLocation?.addressLine1 || dashboardData?.businessLocation?.addressLine2}
            </p>
            <h4>Role:</h4>
            <p>{dashboardData.userRoleInBusiness}</p>
          </div>
        </section>

        {/* Statistics Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Statistics</h2>
          <div className={styles.statsGrid}>
            {dashboardData?.statistics?.map((stat, index) => (
              <StatisticItemDisplay
                key={index}
                stat={{
                  id: index,
                  icon: ThumbsUp,
                  value: stat.value,
                  label: stat.label
                }}
              />
            ))}
          </div>
        </section>

        {/* Completed Hires Card */}
        <div className={styles.completedHiresCard}>
          <div className={styles.completedHiresCount}>
            <span className={styles.completedHiresLabel}>Completed Hires</span>
            <span className={styles.completedHiresNumber}>
              {dashboardData.completedHires}
            </span>
          </div>
          <div className={styles.staffTypesList}>
            <span className={styles.staffTypesTitle}>
              Types of Staff Hired:
            </span>
            <ul>
              {dashboardData?.typesOfStaffHired?.map((type) => (
                <li key={type}>{type}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workforce Analytics Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Workforce Analytics</h2>
          <div className={styles.analyticsChartsContainer}>
            <PieChartComponent />
            <BarChartComponent />
          </div>
        </section>

        {/* Badges Awarded Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges Awarded</h2>
          <div className={styles.badgesGridDisplay}>
            {dashboardData?.badgesEarnedByTheirWorkers?.map((award) => (
              <AwardDisplayBadge
                key={award.id}
                icon={award.icon}
                textLines={award.name}
                color="#eab308"
              />
            ))}
          </div>
        </section>

        {/* Worker Reviews Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Worker Reviews</h2>
          {dashboardData?.reviewsFromWorkers?.length > 0 ? (
            <div className={styles.reviewsListContainer}>
              {dashboardData?.reviewsFromWorkers
                .slice(0, 2)
                .map((review, index) => (
                  <ReviewCardItem
                    key={index}
                    reviewerName={review.workerName}
                    date={review.date}
                    comment={review.reviewText}
                  />
                ))}
            </div>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#a0a0a0" }}>
              No worker reviews yet.
            </p>
          )}
        </section>

        {/* Add Team Member Button
                <button onClick={handleAddTeamMember} className={styles.addTeamMemberButton}>
                    <Users size={20} /> Add team member to account
                </button> */}
      </div>
    </div>
  );
}
