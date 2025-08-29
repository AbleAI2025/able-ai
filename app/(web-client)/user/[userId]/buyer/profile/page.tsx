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
import DashboardData from "@/app/types/BuyerProfileTypes";
import mockDashboardData from "./mockBuyerProfile";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import BuyerProfileVideo from "@/app/components/profile/BuyerProfileVideo";
import ContentCard from "@/app/components/shared/ContentCard";

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

  const isViewQA = false;

  const fetchUserProfile = async () => {
    if (isViewQA) {
      setDashboardData(mockDashboardData);
      setIsLoadingData(false);
      return;
    }
    const { success, profile } = await getGigBuyerProfileAction(user?.token);

    if (success && profile) {
      // Format review dates
      const updatedReviews = (profile.reviews ?? []).map((rev: any) => ({
        ...rev,
        date: rev.date
          ? new Date(rev.date).toISOString().split("T")[0] // "YYYY-MM-DD"
          : null,
      }));

      // Ensure badges always have an icon
      const updatedBadges = (profile.badges ?? []).map((badge: any) => ({
        ...badge,
        icon: badge.icon || DefaultBadgeIcon,
      }));

      setDashboardData({
        ...profile,
        badges: updatedBadges,
        reviews: updatedReviews,
      });
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
      <ScreenHeaderWithBack onBackClick={() => router.back()} />
      <div className={styles.pageWrapper}>
        {/* Profile Header */}
        <header className={styles.profileHeader}>
          <h3 className={styles.profileHeaderName}>{dashboardData.fullName}</h3>
          <p className={styles.profileHeaderUsername}>
            {dashboardData.username}
          </p>
        </header>

        {/* Intro & Business Card Section */}
        <section className={`${styles.section} ${styles.introCard}`}>
          <BuyerProfileVideo
            dashboardData={dashboardData}
            isSelfView={isSelfView}
            isEditingVideo={isEditingVideo}
            setIsEditingVideo={setIsEditingVideo}
            handleVideoUpload={handleVideoUpload}
          />
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
          <h2 className={styles.sectionTitle}>Statistics</h2>
            <div className={styles.statisticsItemsContainer}>
              <StatisticItemDisplay
                stat={{
                  id: 1,
                  icon: ThumbsUp,
                  value: dashboardData?.responseRateInternal || 0,
                  label: `Would work with ${
                    user?.displayName?.split(" ")?.[0] ?? ""
                  } again`,
                  iconColor: "#7eeef9",
                }}
              />
              <StatisticItemDisplay
                stat={{
                  id: 2,
                  icon: MessageSquare,
                  value: dashboardData?.averageRating || 0,
                  label: "Response rate",
                  iconColor: "#7eeef9",
                }}
              />
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
              {dashboardData?.skills?.map((type) => (
                <li key={type}>{type}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Workforce Analytics Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Workforce Analytics</h2>
          <div className={styles.analyticsChartsContainer}>
            <PieChartComponent skillCounts={dashboardData?.skillCounts} />
            <BarChartComponent totalPayments={dashboardData?.totalPayments} />
          </div>
        </section>

        {/* Badges Awarded Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges Awarded</h2>
          <div className={styles.badges}>
            {dashboardData && dashboardData.badges.length > 0 ? (
              dashboardData?.badges?.map((badge) => (
                <div className={styles.badge} key={badge.id}>
                  <AwardDisplayBadge
                    {...(badge?.badge?.icon ? { icon: badge.badge?.icon } : {})}
                    textLines={badge?.badge?.description ?? ""}
                  />
                </div>
              ))
            ) : (
              <p className={styles.noBadges}>No badges available</p>
            )}
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
            <p className={styles.noReviews}>No worker reviews yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
