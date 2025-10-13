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

// Empty dashboard data for loading states
const emptyDashboardData = {
  fullName: "",
  username: "",
  fullCompanyName: "",
  companyRole: "",
  socialLink: "",
  responseRateInternal: 0,
  averageRating: 0,
  completedHires: 0,
  topSkills: [],
  badges: [],
  reviews: [],
  statistics: [],
  badgesEarnedByTheirWorkers: [],
};

export default function BuyerProfilePage() {
  const {
    dashboardData,
    isLoadingData,
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

  return (
    <StripeConnectionGuard userId={authUserId || ""} redirectPath={`/user/${authUserId}/settings`}>
      <div className={styles.container}>
        <ScreenHeaderWithBack />
        <div className={styles.pageWrapper}>
          {/* Show loading/error state only if there's an auth/user error */}
          {(!user || (isLoadingData && !dashboardData)) ? (
            <div className={styles.loadingContainer}>
              <Loader2 className="animate-spin" size={32} /> Loading Dashboard...
            </div>
          ) : (
            <>
              <Header
                dashboardData={dashboardData || emptyDashboardData}
                onEditName={() => setIsOpen(true)}
                onEditSocialLink={() => setIsSocialModalOpen(true)}
              />

              <IntroSection
                dashboardData={dashboardData || emptyDashboardData}
                businessInfo={businessInfo}
                isSelfView={isSelfView}
                isEditingVideo={isEditingVideo}
                setIsEditingVideo={setIsEditingVideo}
                handleVideoUpload={handleVideoUpload}
                onEditBusiness={() => setIsModalOpen(true)}
              />

              {user && (
                <StatisticsSection
                  dashboardData={dashboardData || emptyDashboardData}
                  user={user}
                />
              )}

              <CompletedHires
                dashboardData={dashboardData || emptyDashboardData}
              />

              <WorkforceAnalytics
                dashboardData={dashboardData || emptyDashboardData}
              />

              <BadgesSection
                dashboardData={dashboardData || emptyDashboardData}
              />

              <ReviewsSection
                dashboardData={dashboardData || emptyDashboardData}
              />
            </>
          )}
        </div>
        {/* Edit Name Modal */}
        {isOpen && dashboardData && (
          <UserNameModal
            userId={user?.uid || ""}
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
        {isSocialModalOpen && dashboardData && (
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
