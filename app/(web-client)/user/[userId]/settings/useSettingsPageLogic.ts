"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";
import { UserRole } from "@/app/types/SettingsTypes";
import { getDetailedStripeStatus } from "@/app/actions/stripe/get-detailed-stripe-status";
import { usePaymentSettings } from "./hooks/usePaymentSettings";
import { useUserProfileSettings } from "./hooks/useUserProfileSettings";
import { useNotificationSettings } from "./hooks/useNotificationSettings";
import { useAuthSettings } from "./hooks/useAuthSettings";
import { useAccountManagement } from "./hooks/useAccountManagement";
import { createDefaultUserSettings } from "./settingsUtils";

export const useSettingsPageLogic = () => {
  const { user } = useAuth();

  const [error, setError] = useState<string | null>(null);

  const userLastRole = getLastRoleUsed() as UserRole;

  // Use custom hooks
  const paymentSettings = usePaymentSettings(userLastRole);
  const userProfileSettings = useUserProfileSettings(user);
  const notificationSettings = useNotificationSettings(user, userProfileSettings.userSettings, userProfileSettings.setUserSettings);
  const authSettings = useAuthSettings(user);
  const accountManagement = useAccountManagement(user);

  // Derive settings from notificationSettings (which uses userProfileSettings.userSettings)
  const profileVisibility = notificationSettings.profileVisibility;
  const notificationEmail = notificationSettings.notificationEmail;
  const notificationSms = notificationSettings.notificationSms;

  // Wrapper functions to match component expectations
  const handleProfileUpdateWrapper = userProfileSettings.handleProfileUpdate;
  const handleToggleEmailNotificationWrapper = notificationSettings.handleToggleEmailNotification;
  const handleToggleSmsNotificationWrapper = notificationSettings.handleToggleSmsNotification;
  const handleToggleProfileVisibilityWrapper = notificationSettings.handleToggleProfileVisibility;
  const handleChangePasswordWrapper = authSettings.handleChangePassword;
  const handleForgotPasswordWrapper = authSettings.handleForgotPassword;
  const handleLogoutWrapper = authSettings.handleLogout;
  const handleStripeConnectWrapper = () => paymentSettings.handleStripeConnect(user);
  const handleOpenStripeConnectionWrapper = paymentSettings.handleOpenStripeConnection;
  const generateCustomerPortalSessionWrapper = () => paymentSettings.generateCustomerPortalSession(user);
  const handleResendVerification = authSettings.handleResendVerification;

  // Handle modal close with dismissal tracking - now delegated to paymentSettings
  const handleStripeModalClose = paymentSettings.handleStripeModalClose;

  const fetchSettings = async () => {
    try {
      await userProfileSettings.fetchSettings();

      // Fetch detailed Stripe status
      if (user?.uid) {
        // Use a default role if userLastRole is null
        const roleToCheck = userLastRole || 'GIG_WORKER';
        const detailedStatus = await getDetailedStripeStatus(user.uid, roleToCheck);

        // Always update userSettings with detailed Stripe status, even if userSettings is null
        const currentSettings = userProfileSettings.userSettings || createDefaultUserSettings(user, roleToCheck);

        userProfileSettings.setUserSettings({
          ...currentSettings,
          buyerConnected: detailedStatus.buyerConnected,
          canPay: detailedStatus.canPay,
          workerConnected: detailedStatus.workerConnected,
          canEarn: detailedStatus.canEarn,
          lastRole: roleToCheck,
          currency: detailedStatus.currency,
          country: detailedStatus.country,
          businessType: detailedStatus.businessType,
          hasAccountDetails: detailedStatus.hasAccountDetails,
          payoutsEnabled: detailedStatus.payoutsEnabled,
          chargesEnabled: detailedStatus.chargesEnabled,
        });

      }
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
    if (user && !userProfileSettings.isLoadingSettings && userProfileSettings.userSettings && !paymentSettings.showStripeModal && !paymentSettings.stripeModalDismissed) {
      const userSettings = userProfileSettings.userSettings;

      // Only check modal status if we have the detailed Stripe status fields
      // This prevents showing the modal before the detailed status is loaded
      const hasDetailedStatus = userLastRole === 'BUYER' 
        ? userSettings.buyerConnected !== undefined 
        : userSettings.workerConnected !== undefined;

      if (hasDetailedStatus) {
        // Show modal only if user is not connected to Stripe and hasn't dismissed it
        // Use connection status instead of capability status
        const isNotConnected = userLastRole === 'BUYER' 
          ? !userSettings.buyerConnected 
          : !userSettings.workerConnected;

        if (userLastRole && isNotConnected) {
          paymentSettings.setShowStripeModal(true);
        }
      }
    }
  }, [user, userProfileSettings.userSettings, userProfileSettings.isLoadingSettings, userLastRole, paymentSettings.showStripeModal, paymentSettings.stripeModalDismissed, paymentSettings]);

  return {
    user,
    userSettings: userProfileSettings.userSettings,
    isLoadingSettings: userProfileSettings.isLoadingSettings,
    error,
    showDeleteAccountModal: accountManagement.showDeleteAccountModal,
    setShowDeleteAccountModal: accountManagement.setShowDeleteAccountModal,
    showStripeModal: paymentSettings.showStripeModal,
    currentStep: paymentSettings.currentStep,
    isConnectingStripe: paymentSettings.isConnectingStripe,
    handleResendVerification,
    isResendingEmail: authSettings.isResendingEmail,
    handleDeleteAccountConfirmed: accountManagement.handleDeleteAccountConfirmed,
    userLastRole,
    handleStripeModalClose,
    handleOpenStripeConnection: handleOpenStripeConnectionWrapper,
    handleStripeConnect: handleStripeConnectWrapper,
    isDeletingAccount: accountManagement.isDeletingAccount,
    profileSectionProps: {
      displayName: userProfileSettings.displayName,
      setDisplayName: userProfileSettings.setDisplayName,
      phone: userProfileSettings.phone,
      setPhone: userProfileSettings.setPhone,
      handleProfileUpdate: handleProfileUpdateWrapper,
      isSavingProfile: userProfileSettings.isSavingProfile,
      user,
    },
    paymentSectionProps: {
      userLastRole,
      userSettings: userProfileSettings.userSettings,
      handleStripeConnect: handleStripeConnectWrapper,
      isConnectingStripe: paymentSettings.isConnectingStripe,
      generateCustomerPortalSession: generateCustomerPortalSessionWrapper,
    },
    notificationSectionProps: {
      notificationEmail,
      handleToggleEmailNotification: handleToggleEmailNotificationWrapper,
      notificationSms,
      handleToggleSmsNotification: handleToggleSmsNotificationWrapper,
    },
    privacySectionProps: {
      profileVisibility,
      handleToggleProfileVisibility: handleToggleProfileVisibilityWrapper,
    },
    securitySectionProps: {
      currentPassword: authSettings.currentPassword,
      setCurrentPassword: authSettings.setCurrentPassword,
      newPassword: authSettings.newPassword,
      setNewPassword: authSettings.setNewPassword,
      confirmNewPassword: authSettings.confirmNewPassword,
      setConfirmNewPassword: authSettings.setConfirmNewPassword,
      handleChangePassword: handleChangePasswordWrapper,
      handleForgotPassword: handleForgotPasswordWrapper,
      isSavingProfile: authSettings.isSavingProfile,
    },
    bottomNavSectionProps: {
      handleLogout: handleLogoutWrapper,
      setShowDeleteAccountModal: accountManagement.setShowDeleteAccountModal,
    },
  };
};