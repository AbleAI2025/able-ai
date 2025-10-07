"use client";

import { useSettingsPageLogic } from "./useSettingsPageLogic";
import { ProfileSection } from "./ProfileSection";
import { PaymentSection } from "./PaymentSection";
import { NotificationSection } from "./NotificationSection";
import { PrivacySection } from "./PrivacySection";
import { SecuritySection } from "./SecuritySection";
import { BottomNavSection } from "./BottomNavSection";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { StripeModalWrapper } from "./StripeModalWrapper";
import { DiscordSection } from "./DiscordSection";
import { PolicySection } from "./PolicySection";
import { EmailVerificationSection } from "./EmailVerificationSection";

import React from "react";
import Loader from "@/app/components/shared/Loader";
import styles from "./SettingsPage.module.css";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import PhoneNumberModal from "./phoneNumberModal";

export default function SettingsPage() {
  const {
    user,
    userSettings,
    isLoadingSettings,
    error,
    successMessage,
    showDeleteAccountModal,
    setShowDeleteAccountModal,
    showStripeModal,
    currentStep,
    isConnectingStripe,
    handleResendVerification,
    isResendingEmail,
    handleDeleteAccountConfirmed,
    userLastRole,
    handleStripeModalClose,
    handleOpenStripeConnection,
    handleStripeConnect,
    isDeletingAccount,
    profileSectionProps,
    paymentSectionProps,
    notificationSectionProps,
    privacySectionProps,
    securitySectionProps,
    bottomNavSectionProps,
  } = useSettingsPageLogic();
  
  if (isLoadingSettings) {
    return <Loader />;
  }

  if (!user || !userSettings) {
    return (
      <div className={styles.loadingContainer}>
        Unable to load settings. Please ensure you are logged in.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ScreenHeaderWithBack title="Settings" />
        <div className={styles.pageWrapper}>
          <p className={styles.pageDescription}>
            Manage your account preferences and settings
          </p>
          <EmailVerificationSection
            user={user}
            handleResendVerification={handleResendVerification}
            isResendingEmail={isResendingEmail}
          />
          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          <ProfileSection {...profileSectionProps} />

          {user && !user.phoneNumber && (
            <PhoneNumberModal userPhone={user.phoneNumber || ""} />
          )}

          <PaymentSection {...paymentSectionProps} />

          <NotificationSection {...notificationSectionProps} />

          <PrivacySection {...privacySectionProps} />

          <DiscordSection />

          <PolicySection />

          <SecuritySection {...securitySectionProps} />

          <BottomNavSection {...bottomNavSectionProps} />
        </div>

        <DeleteAccountModal
          show={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirm={handleDeleteAccountConfirmed}
          isDeleting={isDeletingAccount}
        />
        <StripeModalWrapper
          show={showStripeModal}
          userLastRole={userLastRole}
          user={user}
          currentStep={currentStep}
          isConnectingStripe={isConnectingStripe}
          onCloseModal={handleStripeModalClose}
          handleOpenStripeConnection={handleOpenStripeConnection}
          handleStripeConnect={handleStripeConnect}
        />
      </div>
    </div>
  );
}
