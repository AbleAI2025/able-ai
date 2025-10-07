"use client";

import { useState, FormEvent } from "react";
import { toast } from "sonner";
import {
  getProfileInfoUserAction,
  updateUserProfileAction,
} from "@/actions/user/user";
import { checkStripeConnection } from "@/app/actions/stripe/check-stripe-connection";
import { formatPhoneNumber } from "./settingsUtils";
import { User } from "@/context/AuthContext";
import { UserSettingsData } from "@/app/types/SettingsTypes";
import { getLastRoleUsed } from "@/lib/last-role-used";
import { UserRole } from "@/app/types/SettingsTypes";

export const useUserProfile = (user: User | null) => {
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

      // Get user role and fetch Stripe connection status
      const userLastRole = getLastRoleUsed() as UserRole;
      const stripeConnection = await checkStripeConnection(user.uid, userLastRole);

      // Determine Stripe status based on connection result
      const stripeAccountStatus: UserSettingsData['stripeAccountStatus'] =
        stripeConnection.connected ? 'connected' : null;
      const canReceivePayouts = stripeConnection.connected;

      const data: UserSettingsData = {
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: userProfile?.phone || null,
        stripeCustomerId: userLastRole === 'BUYER' && stripeConnection.connected ? "customer_connected" : null,
        stripeAccountStatus: userLastRole === 'GIG_WORKER' ? stripeAccountStatus : null,
        stripeConnectAccountId: userLastRole === 'GIG_WORKER' && stripeConnection.connected ? "account_connected" : null,
        canReceivePayouts,
        lastRole: userLastRole,
        notificationPreferences: {
          email: {
            gigUpdates: false,
            platformAnnouncements: false,
          },
          sms: {
            gigAlerts: false,
          },
        },
        privacySettings: {
          profileVisibility: false,
        },
      };
      
      setUserSettings(data);
      setDisplayName(userProfile?.fullName || "");
      setPhone(userProfile?.phone || "");
    } catch (err: unknown) {
      console.error("Error fetching settings:", err);
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
      throw new Error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return {
    userSettings,
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