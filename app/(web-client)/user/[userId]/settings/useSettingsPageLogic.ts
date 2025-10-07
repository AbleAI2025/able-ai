"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import {
  FlowStep,
  UserRole,
} from "@/app/types/SettingsTypes";
import { useUserProfile } from "./useUserProfile";
import { useUserNotifications } from "./useUserNotifications";
import { useUserAuth } from "./useUserAuth";
import { useStripeIntegration } from "./useStripeIntegration";
import { useEmailVerification } from "./useEmailVerification";
import { useAccountDeletion } from "./useAccountDeletion";

export const useSettingsPageLogic = () => {
  const { user } = useAuth();

  // Delete Account related states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  // Privacy Settings related states
  const profileVisibility = false;
  const notificationEmail = false;
  const notificationSms = false;

  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeModalDismissed, setStripeModalDismissed] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const successMessage = null;
  const currentStep: FlowStep = "connecting";

  const userLastRole = getLastRoleUsed() as UserRole;

  // Use custom hooks
  const userProfile = useUserProfile(user);
  const userNotifications = useUserNotifications(user);
  const userAuth = useUserAuth(user);
  const { handleResendVerification: _handleResendVerification, isResendingEmail } = useEmailVerification();
  const { isDeletingAccount, handleDeleteAccountConfirmed } = useAccountDeletion(user, setShowDeleteAccountModal);
  const { generateCustomerPortalSession, handleStripeConnect, isConnectingStripe, handleOpenStripeConnection } = useStripeIntegration(userLastRole);

  // Create wrapper functions for hooks that need user parameter
  const handleResendVerification = () => _handleResendVerification(user);

  // Handle modal close with dismissal tracking
  const handleStripeModalClose = () => {
    setShowStripeModal(false);
    setStripeModalDismissed(true);
  };

  const fetchSettings = async () => {
    try {
      await userProfile.fetchSettings();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Could not load settings.");
      } else {
        setError("Could not load settings.");
      }
    }
  };

  // Fetch user settings from backend API
  useEffect(() => {
    if (user) {
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Check Stripe modal after settings are loaded
  useEffect(() => {
    if (user && !userProfile.isLoadingSettings && userProfile.userSettings && !showStripeModal && !stripeModalDismissed) {
      const userSettings = userProfile.userSettings;

      // Debug logging
      console.log("Stripe modal check after settings loaded:", {
        userLastRole,
        userSettings,
        showStripeModal,
        stripeModalDismissed,
        user,
        canReceivePayouts: userSettings.canReceivePayouts,
        isLoadingSettings: userProfile.isLoadingSettings
      });

      // Show modal only if user is not connected to Stripe and hasn't dismissed it
      if (userLastRole && !userSettings.canReceivePayouts) {
        console.log("Showing Stripe modal - user needs to connect to Stripe");
        setShowStripeModal(true);
      }
    }
  }, [user, userProfile.userSettings, userProfile.isLoadingSettings, userLastRole, showStripeModal, stripeModalDismissed]);

  return {
    user,
    userSettings: userProfile.userSettings,
    isLoadingSettings: userProfile.isLoadingSettings,
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
    setShowStripeModal,
    handleStripeModalClose,
    handleOpenStripeConnection,
    handleStripeConnect: () => handleStripeConnect(user),
    isDeletingAccount,
    profileSectionProps: {
      displayName: userProfile.displayName,
      setDisplayName: userProfile.setDisplayName,
      phone: userProfile.phone,
      setPhone: userProfile.setPhone,
      handleProfileUpdate: userProfile.handleProfileUpdate,
      isSavingProfile: userProfile.isSavingProfile,
      user,
    },
    paymentSectionProps: {
      userLastRole,
      userSettings: userProfile.userSettings,
      handleStripeConnect: () => handleStripeConnect(user),
      isConnectingStripe,
      generateCustomerPortalSession: () => generateCustomerPortalSession(user),
    },
    notificationSectionProps: {
      notificationEmail,
      handleToggleEmailNotification: () => userNotifications.handleToggleEmailNotification(notificationEmail),
      notificationSms,
      handleToggleSmsNotification: () => userNotifications.handleToggleSmsNotification(notificationSms),
    },
    privacySectionProps: {
      profileVisibility,
      handleToggleProfileVisibility: () => userNotifications.handleToggleProfileVisibility(profileVisibility),
    },
    securitySectionProps: {
      currentPassword: userAuth.currentPassword,
      setCurrentPassword: userAuth.setCurrentPassword,
      newPassword: userAuth.newPassword,
      setNewPassword: userAuth.setNewPassword,
      confirmNewPassword: userAuth.confirmNewPassword,
      setConfirmNewPassword: userAuth.setConfirmNewPassword,
      handleChangePassword: userAuth.handleChangePassword,
      handleForgotPassword: userAuth.handleForgotPassword,
      isSavingProfile: userAuth.isSavingProfile,
    },
    bottomNavSectionProps: {
      handleLogout: userAuth.handleLogout,
      setShowDeleteAccountModal,
    },
  };
};