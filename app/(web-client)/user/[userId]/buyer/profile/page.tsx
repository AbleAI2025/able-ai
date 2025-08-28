/* eslint-disable max-lines-per-function */
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { ThumbsUp, Loader2, MessageSquare } from "lucide-react";
import { Star as DefaultBadgeIcon } from "lucide-react";
import styles from "./BuyerProfilePage.module.css";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import ReviewCardItem from "@/app/components/shared/ReviewCardItem";
import PieChartComponent from "@/app/components/shared/PiChart";
import BarChartComponent from "@/app/components/shared/BarChart";
import { useAuth } from "@/context/AuthContext";
import {
  getGigBuyerProfileAction,
  updateVideoUrlBuyerProfileAction,
} from "@/actions/user/gig-buyer-profile";
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
import ContentCard from "@/app/components/shared/ContentCard";

// Types
interface Badge {
  id: string;
  name: string;
  icon: React.ElementType;
}
interface Review {
  id: string;
  name: string;
  date: string;
  text: string;
}

interface DashboardData {
  fullName: string;
  username: string;
  introVideoThumbnailUrl?: string;
  introVideoUrl?: string;
  fullCompanyName: string;
  billingAddressJson?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude?: string;
    longitude?: string;
  };
  companyRole: string;
  videoUrl?: string;
  statistics: Array<{
    icon: React.ElementType;
    value: string;
    label: string;
  }>;
  averageRating: number;
  responseRateInternal: number;
  completedHires: number;
  typesOfStaffHired: string[];
  pieChartData?: Array<{ name: string; value: number; fill: string }>;
  barChartData?: Array<{ name: string; hires: number; spend?: number }>;
  badgesEarnedByTheirWorkers: Badge[];
  reviews: Review[];
  badges: {
    id: string | number;
    icon?: React.ElementType | null;
    notes: string;
    badge: {
      id: string | number;
      icon?: React.ElementType | null;
      description?: string | null;
    };
  }[];
}

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
    const { success, profile } = await getGigBuyerProfileAction(user?.token);
    console.log("profile data:", profile);

    if (success && profile) {
      const updatedBadges = (profile.badges ?? []).map((badge: any) => ({
        ...badge,
        icon: badge.icon || DefaultBadgeIcon,
      }));
      setDashboardData({ ...profile, badges: updatedBadges });
      setError(null);
    } else {
      setError("Failed to fetch profile data");
      setDashboardData(null);
    }

    setIsLoadingData(false);
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
        const filePath = `buyer/${user.uid}/introVideo/introduction-${encodeURI(
          user.email ?? user.uid
        )}.webm`;
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
          <h3 className={styles.profileHeaderName}>{dashboardData.fullName}</h3>
          <p className={styles.profileHeaderUsername}>
            {dashboardData.username}
          </p>
        </header>

        {/* Intro & Business Card Section */}
        <section className={`${styles.section} ${styles.introBusinessCard}`}>
          <div className={styles.videoThumbnailContainer}>
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
                      setIsEditingVideo={setIsEditingVideo}
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
                        setIsEditingVideo={setIsEditingVideo}
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
              {dashboardData?.billingAddressJson?.city},{" "}
              {dashboardData?.billingAddressJson?.country}
              <br />
              {dashboardData?.billingAddressJson?.addressLine1 ||
                dashboardData?.billingAddressJson?.addressLine2}
            </p>
            <h4>Role:</h4>
            <p>{dashboardData?.companyRole}</p>
          </div>
        </section>

        {/* Statistics Section */}
        <section className={styles.section}>
          <ContentCard title="Statistics" className={styles.statisticsCard}>
            <div className={styles.statisticsItemsContainer}>
              {dashboardData?.responseRateInternal && (
                <StatisticItemDisplay
                  stat={{
                    id: 1,
                    icon: ThumbsUp,
                    value: dashboardData.responseRateInternal,
                    label: "Would work with Benji again",
                    iconColor: "#0070f3",
                  }}
                />
              )}
              {dashboardData?.averageRating && (
                <StatisticItemDisplay
                  stat={{
                    id: 2,
                    icon: MessageSquare,
                    value: dashboardData.averageRating,
                    label: "Response rate",
                    iconColor: "#0070f3",
                  }}
                />
              )}
            </div>
          </ContentCard>
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
          <div className={styles.badges}>
            {dashboardData?.badges?.map((badge) => (
              <div className={styles.badge} key={badge.id}>
                <AwardDisplayBadge
                  {...(badge?.badge?.icon ? { icon: badge.badge?.icon } : {})}
                  textLines={badge?.badge?.description ?? ""}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Worker Reviews Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Worker Reviews</h2>
          {dashboardData?.reviews?.length > 0 ? (
            <div className={styles.reviewsListContainer}>
              {dashboardData?.reviews.map((review, index) => (
                <ReviewCardItem
                  key={index}
                  reviewerName={review.name}
                  date={review.date.toString()}
                  comment={review.text}
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
