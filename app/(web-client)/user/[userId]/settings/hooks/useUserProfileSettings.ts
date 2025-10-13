"use client";

import { useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  getProfileInfoUserAction,
  updateUserProfileAction,
} from "@/actions/user/user";
import { formatPhoneNumber } from "../settingsUtils";
import { User } from "@/context/AuthContext";
import { UserSettingsData, UserRole } from "@/app/types/SettingsTypes";

export const useUserProfileSettings = (user: User | null) => {
  const [userSettings, setUserSettings] = useState<UserSettingsData | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const fetchSettings = async () => {
    try {
      if (!user?.uid) throw "User not authenticated.";

      const {
        success,
        data: userProfile,
        error,
      } = await getProfileInfoUserAction(user?.token);
      if (!success) throw error;

      const data: UserSettingsData = {
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: userProfile?.phone || null,
        stripeCustomerId: null, // Will be set by payment settings
        stripeAccountStatus: null, // Will be set by payment settings
        stripeConnectAccountId: null, // Will be set by payment settings
        canReceivePayouts: false, // Will be set by payment settings
        lastRole: "BUYER" as UserRole, // Will be set by payment settings
        notificationPreferences: {
          email: {
            gigUpdates: userProfile?.notificationPreferences?.emailGigUpdates ?? false,
            platformAnnouncements: false, // Not implemented yet
          },
          sms: {
            gigAlerts: userProfile?.notificationPreferences?.smsGigAlerts ?? false,
          },
        },
        privacySettings: {
          profileVisibility: userProfile?.profileVisibility ?? false,
        },
      };

      setUserSettings(data);
      setDisplayName(userProfile?.fullName || "");
      setPhone(userProfile?.phone || "");
    } catch (err: unknown) {
      console.error("Error fetching profile settings:", err);
      throw err; // Let parent hook handle error
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    const formattedPhone = formatPhoneNumber(phone);
    if (phone && !formattedPhone) {
      throw new Error("Invalid phone number format. Please enter a valid phone number, e.g., +1234567890");
    }

    setIsSavingProfile(true);

    try {
      const { success: updateSuccess, error: updateError } =
        await updateUserProfileAction(
          { fullName: displayName, phone: formattedPhone || phone },
          user?.token
        );

      if (!updateSuccess) {
        throw new Error(updateError || "Failed to update profile.");
      }

      const { success: fetchSuccess, data: updatedProfile, error: fetchError } =
        await getProfileInfoUserAction(user?.token);
      if (!fetchSuccess) throw new Error(typeof fetchError === 'string' ? fetchError : "Failed to fetch updated profile");

      // Update local state with the new values (safely handle undefined/null)
      if (updatedProfile) {
        setDisplayName(updatedProfile.fullName || "");
        setPhone(updatedProfile.phone || "");
      }

      toast.success("Profile updated successfully");
      return { success: true, data: updatedProfile };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile.";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    userSettings,
    setUserSettings,
    isLoadingSettings,
    isSavingProfile,
    displayName,
    setDisplayName,
    phone,
    setPhone,
    fetchSettings,
    handleProfileUpdate,
  };
};