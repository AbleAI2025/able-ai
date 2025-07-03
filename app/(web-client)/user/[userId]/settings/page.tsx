"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updatePassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from "firebase/auth";

// Assuming shared components are structured like this
import InputField from "@/app/components/form/InputField"; // Corrected path
// import Logo from '@/app/components/brand/Logo'; // Corrected path, if needed

import styles from "./SettingsPage.module.css";
import {
  User,
  Shield,
  LogOut,
  Save,
  CreditCard,
  CircleMinus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"; // Added new icons
import Loader from "@/app/components/shared/Loader";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/firebase/clientApp";
import { createAccountLink } from "@/app/actions/stripe/create-account-link";
import { createPortalSession } from "@/app/actions/stripe/create-portal-session";
import { FirebaseError } from "firebase/app";

// Define a type for user settings fetched from backend
interface UserSettingsData {
  displayName: string;
  email: string; // Usually not editable directly here
  phone?: string | null; // Added phone field
  // Stripe Connect related fields (essential for Gig Workers, optional for Buyers unless they also act as sellers)
  stripeAccountId: string | null; // The Stripe Connect Account ID
  stripeAccountStatus:
  | "connected"
  | "pending_verification"
  | "incomplete"
  | "restricted"
  | "disabled"
  | null;
  canReceivePayouts: boolean; // Derived on backend, true if Stripe account is fully setup and can receive payouts

  notificationPreferences: {
    email: {
      gigUpdates: boolean;
      platformAnnouncements: boolean;
      marketing?: boolean;
    };
    sms: {
      gigAlerts: boolean;
    };
  };
  // Add other settings fields as needed (e.g., privacy settings)
  privacySettings: {
    // Added privacy settings field
    profileVisibility: boolean;
    // Add other privacy settings fields as needed
  };
}

export default function SettingsPage() {
  const router = useRouter();

  const {
    user
  } = useAuth();

  const [userSettings, setUserSettings] = useState<UserSettingsData | null>(
    null
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Stripe Connect related states
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  // Delete Account related states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Privacy Settings related states
  const [profileVisibility, setProfileVisibility] = useState(false); // State for profile visibility

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState(""); // Added state for phone number
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // Notification preferences
  const [emailGigUpdates, setEmailGigUpdates] = useState(false);
  const [emailPlatformAnnouncements, setEmailPlatformAnnouncements] =
    useState(false);
  const [smsGigAlerts, setSmsGigAlerts] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user settings from backend API
  useEffect(() => {
    if (user) {
      // authUserId is now derived from user?.uid
      setIsLoadingSettings(true);
      // Replace with your actual API call
      const fetchSettings = async () => {
        try {
          // const response = await fetch(`/api/users/settings`); // API would use authUserId from token
          // if (!response.ok) throw new Error('Failed to fetch settings');
          // const data = await response.json();

          // MOCK DATA FOR NOW - Replace with API call
          await new Promise((res) => setTimeout(res, 500)); // Simulate delay
          const data: UserSettingsData = {
            displayName: user?.displayName || "User", // Access displayName from user object
            email: user?.email || "", // Access email from user object
            phone: user?.phoneNumber || "", // Added mock phone data
            // Added mock Stripe data
            stripeAccountId: null, // Or a mock ID like 'acct_123abc'
            stripeAccountStatus: null, // Or 'connected', 'pending_verification', etc.
            canReceivePayouts: false, // Or true

            privacySettings: {
              // Added mock privacy data
              profileVisibility: true, // Example initial value
            },

            notificationPreferences: {
              email: {
                gigUpdates: true,
                platformAnnouncements: true,
                marketing: false,
              },
              sms: { gigAlerts: false },
            },
          };
          setUserSettings(data);
          setDisplayName(data.displayName);
          setEmailGigUpdates(data.notificationPreferences.email.gigUpdates);
          setEmailPlatformAnnouncements(
            data.notificationPreferences.email.platformAnnouncements
          );
          // setSmsGigAlerts(data.notificationPreferences.sms.gigAlerts); // SMS commented out
          setProfileVisibility(data.privacySettings.profileVisibility); // Set initial state for privacy setting
          // setPhone(data.phone || ''); // Set initial state for phone
        } catch (err: unknown) {
          if (err instanceof Error) {
            setError(err.message || "Could not load settings.");
          } else {
            setError("Could not load settings.");
          }
        } finally {
          setIsLoadingSettings(false);
        }
      };
      fetchSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Update dependency array

  const clearMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  const handleProfileUpdate = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    setIsSavingProfile(true);
    // TODO: API call to update profile (e.g., PUT /api/users/profile)
    // This API would update both PostgreSQL and relevant Firestore public profile fields
    try {
      console.log("Updating profile with name:", displayName);
      // Simulate API call
      await new Promise((res) => setTimeout(res, 1000));
      setSuccessMessage("Profile updated successfully!");
      // Optionally, trigger a refetch if name changes often or rely on context update if displayName is part of User object
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update profile.");
      } else {
        setError("Failed to update profile.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (!user) {
      // Use user object
      setError("User not authenticated.");
      return;
    }

    setIsSavingProfile(true); // Use same loading state for simplicity or create new
    try {
      // Re-authenticate for sensitive operation (optional but recommended)
      // const credential = EmailAuthProvider.credential(user.email!, currentPassword); // Use user.email
      // await reauthenticateWithCredential(user, credential); // Use user

      // Then update password
      await updatePassword(user, newPassword); // Use user
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Password change error:", err);
        setError(
          err.code === "auth/wrong-password"
            ? "Incorrect current password."
            : err.message || "Failed to change password."
        );
      }
      else {
        console.error("Password change error:", err);
        setError("Failed to change password.");
      }

    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    if (!userSettings?.email) {
      setError("Email address not found.");
      return;
    }
    try {
      await sendPasswordResetEmail(authClient, userSettings.email);
      setSuccessMessage("Password reset email sent. Please check your inbox.");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message || "Failed to send password reset email.");
      } else {
        setError("Failed to send password reset email.");
      }
    }
  };

  const handleNotificationPreferencesUpdate = async (event: FormEvent) => {
    event.preventDefault();
    clearMessages();
    setIsSavingNotifications(true);
    const preferences = {
      email: {
        gigUpdates: emailGigUpdates,
        platformAnnouncements: emailPlatformAnnouncements,
      },
      sms: { gigAlerts: smsGigAlerts },
    };
    // TODO: API call to PUT /api/users/notification-preferences
    try {
      console.log("Updating notification preferences:", preferences);
      await new Promise((res) => setTimeout(res, 1000)); // Simulate API
      setSuccessMessage("Notification preferences saved!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Failed to save notification preferences.");
      } else {
        setError("Failed to save notification preferences.");
      }
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleLogout = async () => {
    clearMessages();
    try {
      await firebaseSignOut(authClient);
      router.push("/signin");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Logout failed.");
      } else {
        setError("Logout failed.");
      }
    }
  };

  // Stripe Connect Onboarding
  const handleStripeConnect = async () => {
    if (!user) return

    clearMessages();
    setIsConnectingStripe(true);
    try {
      const response = await createAccountLink(user?.uid);
      if (response.error && response.status === 500) throw new Error(response.error);

      if (response.status === 200 && response.url) {
        window.location.href = response.url;
      }

    } catch (err: any) {
      setError(err.message || "Failed to initiate Stripe Connect.");
    } finally {
      setIsConnectingStripe(false);
    }
  };

  // Manage Stripe Account / Payment Settings
  const handleManageStripeAccount = async () => {
    if (!user) return

    clearMessages();
    // setIsConnectingStripe(true); // Use a different loading state if needed
    try {
      const response = await createPortalSession(user?.uid);

      if (response.error && response.status === 500) throw new Error(response.error);

      if (response.status === 200 && response.url) {
        window.location.href = response.url;
      }

    } catch (err: any) {
      setError(err.message || "Failed to open Stripe Portal.");
    } finally {
      // setIsConnectingStripe(false); // Reset loading state
    }
  };

  // Delete Account Confirmation
  const handleDeleteAccountConfirmed = async () => {
    clearMessages();
    setIsDeletingAccount(true);
    try {
      // TODO: API call to DELETE /api/users/account
      console.log("Deleting account...");
      // Simulate API call
      await new Promise((res) => setTimeout(res, 2000));
      setSuccessMessage("Account deleted successfully. Redirecting...");
      // On success, logout and redirect
      await firebaseSignOut(authClient);
      router.push("/signin"); // Or home page
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete account.");
      }
      else {
        setError("Failed to delete account.");
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false); // Close modal regardless of success/failure
    }
  };

  // Handle Profile Visibility Change
  /*
  const handleProfileVisibilityChange = async (checked: boolean) => {
    clearMessages();
    // setIsSavingProfile(true); // Use a different loading state if needed
    setProfileVisibility(checked); // Optimistically update UI
    // TODO: API call to PUT /api/users/privacy-settings
    try {
      console.log("Updating profile visibility:", checked);
      await new Promise((res) => setTimeout(res, 500)); // Simulate API
      setSuccessMessage("Profile visibility updated!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to update profile visibility.");
      }
      else {
        setError("Failed to update profile visibility.");
      }
      // Revert state if API fails
      setProfileVisibility(!checked);
    } finally {
      // setIsSavingProfile(false); // Reset loading state
    }
  };
  */

  if (isLoadingSettings) {
    return <Loader />;
  }

  if (!user || !userSettings) {
    // Should have been caught by useEffect, but as a fallback
    return (
      <div className={styles.loadingContainer}>
        Unable to load settings. Please ensure you are logged in.
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.pageWrapper}>
          <header className={styles.pageHeader}>
            <h1>Settings</h1>
            <p>Manage your account preferences and settings</p>{" "}
            {/* Added descriptive text */}
          </header>

          {error && <p className={styles.errorMessage}>{error}</p>}
          {successMessage && (
            <p className={styles.successMessage}>{successMessage}</p>
          )}

          {/* Inline Stripe Prompt / Status Indicator (Alternative to Modal) */}
          {userSettings &&
            userSettings.stripeAccountId &&
            userSettings.stripeAccountStatus === "connected" &&
            userSettings.canReceivePayouts && (
              <div
                className={`${styles.section} ${styles.stripeStatusBannerConnected}`}
              >
                <CheckCircle size={20} /> Stripe account connected and active.
              </div>
            )}
          {userSettings &&
            (!userSettings.stripeAccountId ||
              !userSettings.canReceivePayouts) && (
              <div className={`${styles.section} ${styles.stripePromptInline}`}>
                <div className={styles.stripePromptHeader}>
                  <div className={styles.stripeIconWrapper}>
                    <AlertTriangle size={28} color="#ffc107" />
                  </div>
                  <h3>Get Paid with Stripe!</h3>
                </div>
                <p>
                  To receive payments for your gigs, you must connect your bnak
                  account through our payment provider, Stripe. This is secure,
                  free, and only takes a minute.
                </p>
                <button
                  onClick={handleStripeConnect}
                  className={styles.stripeButton}
                  disabled={isConnectingStripe}
                >
                  {isConnectingStripe
                    ? "Connecting..."
                    : "Connect My Bank Account"}
                </button>
                <div className={styles.stripeStatus}>
                  <AlertTriangle size={20} color="#ffc107" />
                  <span>
                    {userSettings.stripeAccountStatus
                      ? userSettings.stripeAccountStatus.replace("_", " ")
                      : "Not Connected"}
                  </span>
                </div>
              </div>
            )}

          {/* Profile Information Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <User size={20} style={{ marginRight: "0.5rem" }} /> Personal
              Information
            </h2>
            {/* ... (DisplayName, Email - as before) ... */}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="displayName" className={styles.label}>
                  Display Name
                </label>
                <InputField
                  id="displayName"
                  name="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisplayName(e.target.value)
                  }
                  placeholder="Your display name"
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <input // Display only, not editable directly here typically
                  id="email"
                  type="email"
                  value={userSettings.email}
                  readOnly
                  disabled
                  className={styles.inputField} // Or use InputField component with disabled prop
                />
              </div>
              <div className={styles.formGroup}>
                {" "}
                {/* Added phone field */}
                <label htmlFor="phone" className={styles.label}>
                  Phone Number
                </label>
                <InputField
                  id="phone"
                  name="phone"
                  type="tel" // Use type="tel" for phone numbers
                  value={userSettings.phone || phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPhone(e.target.value)
                  }
                  placeholder="Your phone number"
                />
              </div>
              <div className={styles.actionButtons}>
                <button
                  type="submit"
                  className={styles.button}
                  disabled={isSavingProfile}
                >
                  <Save size={16} />{" "}
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </section>

          {/* Payment Settings Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <CreditCard size={20} style={{ marginRight: "0.5rem" }} /> Payment
              Settings
            </h2>
            {!userSettings?.stripeAccountId && !userSettings.canReceivePayouts ? (
              <div className={styles.settingItem}>
                <span className={styles.settingLabel}>
                  Manage your payouts and bank details.
                </span>
                <button
                  onClick={handleManageStripeAccount}
                  className={`${styles.button} ${styles.secondary}`}
                >
                  Open Stripe Portal
                </button>
              </div>
            ) : (
              <p className={styles.settingLabel}>
                Connect your Stripe account to manage payment settings.
              </p>
            )}
          </section>

          {/* Notification Preferences Section
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><Bell size={20} style={{ marginRight: '0.5rem' }} /> Notification Preferences</h2>
            <form onSubmit={handleNotificationPreferencesUpdate}>
              <SwitchControl
                id="emailGigUpdates"
                label="Email: Gig Updates & Offers"
                checked={emailGigUpdates}
                onCheckedChange={setEmailGigUpdates}
              />
              <SwitchControl
                id="emailPlatformAnnouncements"
                label="Email: Platform News & Announcements"
                checked={emailPlatformAnnouncements}
                onCheckedChange={setEmailPlatformAnnouncements}
              />
              SMS Notification Option (Commented Out)
              
              <SwitchControl
                id="smsGigAlerts"
                label="SMS: Urgent Gig Alerts (if phone provided)"
                checked={smsGigAlerts}
                onCheckedChange={setSmsGigAlerts}
              />
            
              <div className={styles.actionButtons}>
                  <button type="submit" className={styles.button} disabled={isSavingNotifications}>
                      <Save size={16} /> {isSavingNotifications ? 'Saving...' : 'Save Preferences'}
                  </button>
              </div>
            </form>
          </section> */}

          {/* Account Security Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <Shield size={20} style={{ marginRight: "0.5rem" }} /> Account
              Security
            </h2>
            <form
              onSubmit={handleChangePassword}
              className={styles.passwordChangeSection}
            >
              {/* <div className={styles.formGroup}>
                <label htmlFor="currentPassword" className={styles.label}>Current Password</label>
                <InputField
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                  placeholder="Your current password"
                  required
                />
              </div> */}
              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  New Password
                </label>
                <InputField
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Enter new password (min. 10 characters)"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="confirmNewPassword" className={styles.label}>
                  Confirm New Password
                </label>
                <InputField
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmNewPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <div className={styles.actionButtons}>
                <button
                  type="submit"
                  className={styles.button}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
            <div style={{ marginTop: "1rem", textAlign: "right" }}>
              <button
                onClick={handleForgotPassword}
                className={`${styles.button} ${styles.secondary}`}
              >
                Forgot Password? Send Reset Link
              </button>
            </div>
          </section>

          {/* Privacy Settings Section (NEW)
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><EyeOff size={20} style={{ marginRight: '0.5rem' }} /> Privacy Settings</h2>
            <SwitchControl
              id="profileVisibility"
              label="Profile Visibility (Public/Private for search)"
              checked={profileVisibility} // Connect to state
              onCheckedChange={handleProfileVisibilityChange} // Connect to handler
            />
            Add more privacy toggles as needed
          </section> */}

          {/* Community & Legal Section (Combined & NEW)
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}><Info size={20} style={{ marginRight: '0.5rem' }} /> Community & Legal</h2>
            <ul className={styles.linkList}>
              <li><a href="YOUR_DISCORD_LINK" target="_blank" rel="noopener noreferrer">Join our Community Discord</a></li>
              <li><a href="/user-policy" target="_blank" rel="noopener noreferrer">User Policy</a></li>
              <li><a href="/terms-of-service" target="_blank" rel="noopener noreferrer">Terms of Service</a></li>
              <li><a href="/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            </ul>
          </section> */}

          {/* Actions Section (Bottom Nav from user prompt) */}
          <section className={styles.bottomNavSection}>
            <div className={styles.bottomNav}>
              {" "}
              {/* Using user's class name idea */}
              {/* <button onClick={() => alert('Contact support: support@ableai.com')} className={styles.bottomNavLink}>
                <MessageSquare size={18} /> Contact Able AI Agent
              </button> */}
              <button onClick={handleLogout} className={styles.bottomNavLink}>
                <LogOut size={18} /> Logout
              </button>
              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className={`${styles.bottomNavLink} ${styles.dangerLink}`}
              >
                <CircleMinus size={18} /> Delete Account
              </button>
            </div>
          </section>
        </div>

        {/* Stripe Connect Prompt Modal (Optional, if not inline) */}
        {/* {showStripePromptModal && (
          <Modal title="Connect Stripe to Get Paid" onClose={() => setShowStripePromptModal(false)}>
            // Content of the prompt
            <button onClick={handleStripeConnect} disabled={isConnectingStripe}>...</button>
          </Modal>
        )} */}

        {/* Delete Account Confirmation Modal */}
        {showDeleteAccountModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowDeleteAccountModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.modalTitle}>Confirm Account Deletion</h3>
              <p>
                Are you absolutely sure you want to delete your account? This
                action is permanent and cannot be undone. All your data, gigs,
                and profile information will be removed.
              </p>
              <div className={styles.modalActions}>
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className={`${styles.button} ${styles.secondary}`}
                  disabled={isDeletingAccount}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccountConfirmed}
                  className={`${styles.button} ${styles.danger}`}
                  disabled={isDeletingAccount}
                >
                  {isDeletingAccount ? "Deleting..." : "Yes, Delete My Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
