"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updatePassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import InputField from "@/app/components/form/InputField";
import styles2 from "@/app/components/shared/AiSuggestionBanner.module.css";

import styles from "./SettingsPage.module.css";
import {
  Shield,
  LogOut,
  Save,
  CircleMinus,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Loader from "@/app/components/shared/Loader";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/firebase/clientApp";
import { createAccountLink } from "@/app/actions/stripe/create-account-link";
import { createPortalSession } from "@/app/actions/stripe/create-portal-session";
import { FirebaseError } from "firebase/app";
import SwitchControl from "@/app/components/shared/SwitchControl";
import Logo from "@/app/components/brand/Logo";
import { toast } from "sonner";
import { getProfileInfoUserAction, updateNotificationEmailAction, updateNotificationSmsAction, updateProfileVisibilityAction, updateUserProfileAction } from "@/actions/user/user";
import { useFirebase } from "@/context/FirebaseContext";

interface UserSettingsData {
  displayName: string;
  email: string;
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
  stripeConnectAccountId: string | null;
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

  const { user } = useAuth();

  const [userSettings, setUserSettings] = useState<UserSettingsData | null>(
    null
  );
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Stripe Connect related states
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);

  // Delete Account related states
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Privacy Settings related states
  const [profileVisibility, setProfileVisibility] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState(false);
  const [notificationSms, setNotificationSms] = useState(false);


  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState(""); // Added state for phone number
  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showStripeModal, setShowStripeModal] = useState(false);

  // Notification preferences
  const [emailGigUpdates, setEmailGigUpdates] = useState(false);
  const [emailPlatformAnnouncements, setEmailPlatformAnnouncements] =
    useState(false);
  const { authClient } = useFirebase();

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      if (!user?.uid) throw "User not authenticated."
      
      const { success, data: userProfile, error } = await getProfileInfoUserAction(user?.token);
      if (!success) throw error;

      const data: UserSettingsData = {
        displayName: user?.displayName || "",
        email: user?.email || "",
        phone: userProfile?.phone || "",
        // Added mock Stripe data
        stripeAccountId: userProfile?.stripeCustomerId|| null, // Or a mock ID like 'acct_123abc'
        stripeAccountStatus: "incomplete",
        stripeConnectAccountId: userProfile?.stripeConnectAccountId || null, // Or 'connected', 'pending_verification', etc.
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
      setDisplayName(userProfile?.fullName || "");
      setPhone(userProfile?.phone || "");
      setEmailGigUpdates(data.notificationPreferences.email.gigUpdates);
      setEmailPlatformAnnouncements(
        data.notificationPreferences.email.platformAnnouncements
      );
      if (!data.stripeAccountId || !data.stripeAccountStatus) {
        setShowStripeModal(true)
      }
      // setSmsGigAlerts(data.notificationPreferences.sms.gigAlerts); // SMS commented out
      setProfileVisibility(userProfile?.profileVisibility || false);
      setNotificationEmail(userProfile?.notificationPreferences.emailGigUpdates || false)
      setNotificationSms(userProfile?.notificationPreferences.smsGigAlerts || false)
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

  // Fetch user settings from backend API
  useEffect(() => {
    if (user) {
      // authUserId is now derived from user?.uid
      setIsLoadingSettings(true);
      // Replace with your actual API call
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
  
    try {
      const { success: updateSuccess, error: updateError } = await updateUserProfileAction(
        { fullName: displayName, phone: phone },
        user?.token
      );
  
      if (!updateSuccess) throw updateError;
  
      const { success: fetchSuccess, error: fetchError } = await getProfileInfoUserAction(user?.token);
      if (!fetchSuccess) throw fetchError;
  
      toast.success("Profile updated successfully");
      setSuccessMessage("Profile updated successfully!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile.";
      setError(message);
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

    setIsSavingProfile(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      setSuccessMessage("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success(`Password changed successfully.`);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        console.error("Error changing password", err);
        if (err.code === "auth/wrong-password.") {
          setError("Current password incorrect.");
        } else if (err.code === "auth/requires-recent-login") {
          setError("For security login again");
        } else {
          setError(err.message || "rror changing password.");
        }
      } else {
        console.error("Error unknown:", err);
        setError("rror changing password.");
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
      if (authClient) {
        await sendPasswordResetEmail(authClient, userSettings.email);
        setSuccessMessage("Password reset email sent. Please check your inbox.");
        toast.success(`Check your email to reset your password.`);
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(err.message || "Failed to send password reset email.");
      } else {
        setError("Failed to send password reset email.");
      }
    }
  };

  const handleLogout = async () => {
    clearMessages();
    try {
      if(authClient) {
        await firebaseSignOut(authClient);
        router.push("/signin");
      }
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
      if (authClient) {
        await firebaseSignOut(authClient);
        router.push("/signin"); // Or home page
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to delete account.");
      } else {
        setError("Failed to delete account.");
      }
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountModal(false); // Close modal regardless of success/failure
    }
  };

  async function handleToggleEmailNotification() {
    try {
      const { data, error } = await updateNotificationEmailAction(
        { emailProferences: !notificationEmail },
        user?.token
      );
        setNotificationEmail(error ? notificationEmail : data);
        toast.success("Email notification updated")
    } catch (error) {
      console.error("Failed to update email notifications", error);
      setNotificationEmail(notificationEmail); // Revert to current value 
    }
  }
  
  async function handleToggleSmsNotification() {
    try {
      const {data, error } = await updateNotificationSmsAction(
        { smsGigAlerts: !notificationSms },
        user?.token
      );
        setNotificationSms(error ? notificationSms : data);
    } catch (error) {
      console.error("Failed to update SMS notifications", error);
      setNotificationSms(notificationSms);
    }
  }
  
  async function handleToggleProfileVisibility() {
    try {
      const { data, error } = await updateProfileVisibilityAction(
        { profileVisibility: !profileVisibility },
        user?.token
      );

      setProfileVisibility(error ? profileVisibility : data);
    } catch (error) {
      console.error("Failed to update profile visibility", error);
      setProfileVisibility(profileVisibility);
      
    }
  }
  


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

          {/* Profile Information Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            {/* ... (DisplayName, Email - as before) ... */}
            <form onSubmit={handleProfileUpdate} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="displayName" className={styles.label}>
                  Full Name
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
                  Email
                </label>
                <input // Display only, not editable directly here typically
                  id="email"
                  type="email"
                  value={user.email || ""}
                  readOnly
                  disabled
                  className={styles.inputField} // Or use InputField component with disabled prop
                />
              </div>
              <div className={styles.formGroup}>
                {" "}
                {/* Added phone field */}
                <label htmlFor="phone" className={styles.label}>
                  Phone
                </label>
                <InputField
                  id="phone"
                  name="phone"
                  type="tel" // Use type="tel" for phone numbers
                  value={phone}
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
              Payment Settings - Stripe portal
            </h2>
            <label htmlFor="phone" className={styles.label}>
              Payment method
            </label>
            <InputField
              id="card"
              name="card"
              type="text"
              disabled
              value={"Visa **** 1234"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => () => {
                console.log(e);
              }}
              placeholder="Your display name"
            />
          </section>

          {/* Payment Settings Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Notification Preferences</h2>
            <SwitchControl
              id="emailNotification"
              label="Email Notifications"
              checked={notificationEmail}
              onCheckedChange={() => handleToggleEmailNotification()}
            />
            <SwitchControl
              id="smsNotification"
              label="SMS Notifications"
              checked={notificationSms}
              onCheckedChange={() => handleToggleSmsNotification()}
            />
          </section>

          {/* Payment Settings Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacy Settings</h2>
            <SwitchControl
              id="profileVisibility"
              label="Profile Visibility (Public/Private for search)"
              checked={profileVisibility}
              onCheckedChange={() => handleToggleProfileVisibility()}
            />
          </section>

          {/* Payment Settings Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Community Discord channel</h2>
            <label htmlFor="phone" className={styles.label}>
              Join here
            </label>
          </section>

          {/* Payment Settings Section */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>User policy</h2>
            <label htmlFor="phone" className={styles.label}>
              Read here
            </label>
          </section>

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
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword" className={styles.label}>
                  Contraseña actual
                </label>
                <InputField
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCurrentPassword(e.target.value)
                  }
                  placeholder="Ingresa tu contraseña actual"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="newPassword" className={styles.label}>
                  Nueva contraseña
                </label>
                <InputField
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewPassword(e.target.value)
                  }
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmNewPassword" className={styles.label}>
                  Confirmar nueva contraseña
                </label>
                <InputField
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setConfirmNewPassword(e.target.value)
                  }
                  placeholder="Repite la nueva contraseña"
                  required
                />
              </div>

              <div className={styles.actionButtons}>
                <button
                  type="submit"
                  className={styles.button}
                  disabled={isSavingProfile}
                >
                  {isSavingProfile ? "Cambiando..." : "Cambiar contraseña"}
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

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Logo width={60} height={60} />
            <div
              className={`${styles2.suggestionBanner} ${styles2.suggestionTextContainer}`}
            >
              <p
                className={styles2.dismissedText}
                onClick={() => router.replace(`able-ai`)}
              >
                How can i help?
              </p>
            </div>
          </div>
          <section className={styles.bottomNavSection}>
            <div className={styles.bottomNav}>
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
        {showStripeModal && (
          <div
            className={styles.modalOverlay}
            onClick={() => setShowStripeModal(false)}
          >
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className={styles.stripeIconWrapper}>
                    <AlertTriangle size={28} color="#ffc107" />
                  </div>
                  <h3 style={{
                    marginLeft: "10px"
                  }}>Get Paid with Stripe!</h3>
                </div>
                <button
                  onClick={() => setShowStripeModal(false)}
                  className={styles.closeButton}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <p>
                To receive payments for your gigs, you must connect your bank
                account through our payment provider, Stripe. This is secure,
                free, and only takes a minute.
              </p>

              <div className={styles.modalActions}>
                <button
                  onClick={handleStripeConnect}
                  className={styles.stripeButton}
                  disabled={isConnectingStripe}
                >
                  {isConnectingStripe
                    ? "Connecting..."
                    : "Connect My Bank Account"}
                </button>
              </div>
              <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              >
              <AlertTriangle size={20} color="#ffc107" />
              <p>Not connected</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
