"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { useUserNotifications } from "../useUserNotifications";
import { UserSettingsData } from "@/app/types/SettingsTypes";
import { User } from "@/context/AuthContext";

export const useNotificationSettings = (
  user: User | null,
  userSettings: UserSettingsData | null,
  setUserSettings: (settings: UserSettingsData | null) => void
) => {
  const userNotifications = useUserNotifications(user);

  // Derive settings from userSettings
  const { notificationEmail, notificationSms, profileVisibility } = useMemo(() => {
    const { notificationPreferences, privacySettings } = userSettings || {};
    return {
      notificationEmail: notificationPreferences?.email?.gigUpdates ?? false,
      notificationSms: notificationPreferences?.sms?.gigAlerts ?? false,
      profileVisibility: privacySettings?.profileVisibility ?? false,
    };
  }, [userSettings]);

  const updateUserSettingsState = (updates: Partial<UserSettingsData>) => {
    if (userSettings) {
      setUserSettings({
        ...userSettings,
        ...updates,
      });
    }
  };

  const handleToggleEmailNotification = async () => {
    const newValue = !notificationEmail;
    const currentPreferences = userSettings?.notificationPreferences || { email: { gigUpdates: false, platformAnnouncements: false }, sms: { gigAlerts: false } };
    const currentEmail = currentPreferences.email || { gigUpdates: false, platformAnnouncements: false };

    try {
      // Optimistically update local state
      updateUserSettingsState({
        notificationPreferences: {
          ...currentPreferences,
          email: {
            ...currentEmail,
            gigUpdates: newValue,
          },
        },
      });

      // Make API call
      await userNotifications.handleToggleEmailNotification(notificationEmail);

      toast.success("Email notification updated");
    } catch (error) {
      // Revert on error
      updateUserSettingsState({
        notificationPreferences: {
          ...currentPreferences,
          email: {
            ...currentEmail,
            gigUpdates: notificationEmail,
          },
        },
      });
      throw error;
    }
  };

  const handleToggleSmsNotification = async () => {
    const newValue = !notificationSms;
    const currentPreferences = userSettings?.notificationPreferences || { email: { gigUpdates: false, platformAnnouncements: false }, sms: { gigAlerts: false } };
    const currentSms = currentPreferences.sms || { gigAlerts: false };

    try {
      // Optimistically update local state
      updateUserSettingsState({
        notificationPreferences: {
          ...currentPreferences,
          sms: {
            ...currentSms,
            gigAlerts: newValue,
          },
        },
      });

      // Make API call
      await userNotifications.handleToggleSmsNotification(notificationSms);

      toast.success("SMS notification updated");
    } catch (error) {
      // Revert on error
      updateUserSettingsState({
        notificationPreferences: {
          ...currentPreferences,
          sms: {
            ...currentSms,
            gigAlerts: notificationSms,
          },
        },
      });
      throw error;
    }
  };

  const handleToggleProfileVisibility = async () => {
    const newValue = !profileVisibility;
    const currentPrivacy = userSettings?.privacySettings || { profileVisibility: false };

    try {
      // Optimistically update local state
      updateUserSettingsState({
        privacySettings: {
          ...currentPrivacy,
          profileVisibility: newValue,
        },
      });

      // Make API call
      await userNotifications.handleToggleProfileVisibility(profileVisibility);

      toast.success("Profile visibility updated");
    } catch (error) {
      // Revert on error
      updateUserSettingsState({
        privacySettings: {
          ...currentPrivacy,
          profileVisibility: profileVisibility,
        },
      });
      throw error;
    }
  };

  return {
    notificationEmail,
    notificationSms,
    profileVisibility,
    handleToggleEmailNotification,
    handleToggleSmsNotification,
    handleToggleProfileVisibility,
  };
};