"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import styles from "./BuyerProfilePage.module.css";
import { useBuyerProfileData } from "./hooks/useBuyerProfileData";
import Header from "./sections/Header";
import IntroSection from "./sections/IntroSection";
import StatisticsSection from "./sections/StatisticsSection";
import CompletedHires from "./sections/CompletedHires";
import WorkforceAnalytics from "./sections/WorkforceAnalytics";
import BadgesSection from "./sections/BadgesSection";
import ReviewsSection from "./sections/ReviewsSection";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import UserNameModal from "@/app/components/profile/UserNameModal";
import EditBusinessModal from "@/app/components/profile/EditBusinessModal";
import SocialLinkModal from "./SocialLinkModal";
import StripeConnectionGuard from "@/app/components/shared/StripeConnectionGuard";
import { updateSocialLinkBuyerProfileAction } from "@/actions/user/buyer-profile-updates";

export default function BuyerProfilePage() {
  const {
    dashboardData,
    isLoadingData,
    error,
    businessInfo,
    handleVideoUpload,
    handleSave,
    isSelfView,
    isEditingVideo,
    setIsEditingVideo,
    user,
    authUserId,
    fetchUserProfile,
  } = useBuyerProfileData();

  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);

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
  if (!dashboardData || !authUserId) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>No dashboard data available.</p>
        </div>
      </div>
    );
  }

  return (
    <StripeConnectionGuard userId={authUserId} redirectPath={`/user/${authUserId}/settings`}>
      <div className={styles.container}>
        <ScreenHeaderWithBack />
        <div className={styles.pageWrapper}>
          <Header
            dashboardData={dashboardData}
            onEditName={() => setIsOpen(true)}
            onEditSocialLink={() => setIsSocialModalOpen(true)}
          />

          <IntroSection
            dashboardData={dashboardData}
            businessInfo={businessInfo}
            isSelfView={isSelfView}
            isEditingVideo={isEditingVideo}
            setIsEditingVideo={setIsEditingVideo}
            handleVideoUpload={handleVideoUpload}
            onEditBusiness={() => setIsModalOpen(true)}
          />

          <StatisticsSection dashboardData={dashboardData} user={user} />

          <CompletedHires dashboardData={dashboardData} />

          <WorkforceAnalytics dashboardData={dashboardData} />

          <BadgesSection dashboardData={dashboardData} />

          <ReviewsSection dashboardData={dashboardData} />
        </div>
        {/* Edit Name Modal */}
        {isOpen && (
          <UserNameModal
            userId={user.uid}
            initialValue={dashboardData.fullName}
            fetchUserProfile={fetchUserProfile}
            onClose={() => setIsOpen(false)}
          />
        )}
        {isModalOpen && (
          <EditBusinessModal
            initialData={businessInfo}
            onSave={handleSave}
            onClose={() => setIsModalOpen(false)}
          />
        )}
        {isSocialModalOpen && (
          <SocialLinkModal
            initialValue={dashboardData.socialLink}
            onClose={() => setIsSocialModalOpen(false)}
            fetchUserProfile={fetchUserProfile}
            updateAction={updateSocialLinkBuyerProfileAction}
          />
        )}
      </div>
    </StripeConnectionGuard>
  );
}
