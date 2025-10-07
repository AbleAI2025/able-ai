"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  updatePassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { toast } from "sonner";
import { FirebaseError } from "firebase/app";
import { authClient } from "@/lib/firebase/clientApp";
import { sendEmailVerification } from "firebase/auth";
import { User } from "@/context/AuthContext";

export const useAuthSettings = (user: User | null) => {
  const router = useRouter();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmNewPassword) {
      throw new Error("New passwords do not match.");
    }
    if (newPassword.length < 10) {
      throw new Error("New password must be at least 10 characters long.");
    }
    if (!user) {
      throw new Error("User not authenticated.");
    }

    setIsSavingProfile(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      await updatePassword(user, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password changed successfully!");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        if (err.code === "auth/wrong-password") {
          throw new Error("Current password incorrect.");
        } else if (err.code === "auth/requires-recent-login") {
          throw new Error("For security login again");
        } else {
          throw new Error(err.message || "Error changing password.");
        }
      } else {
        throw new Error("Error changing password.");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) {
      throw new Error("Email address not found.");
    }
    try {
      if (authClient) {
        await sendPasswordResetEmail(authClient, user.email);
        toast.success("Password reset email sent. Check your inbox.");
      }
    } catch (err) {
      if (err instanceof FirebaseError) {
        throw new Error(err.message || "Failed to send password reset email.");
      } else {
        throw new Error("Failed to send password reset email.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (authClient) {
        await firebaseSignOut(authClient);
        router.push("/");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message || "Logout failed.");
      } else {
        throw new Error("Logout failed.");
      }
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;

    setIsResendingEmail(true);
    try {
      await sendEmailVerification(user);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      toast.error("Failed to send verification email. Please try again later.");
      console.error("Error resending verification email:", error);
    } finally {
      setIsResendingEmail(false);
    }
  };

  return {
    // Password change
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    isSavingProfile,
    handleChangePassword,
    handleForgotPassword,

    // Logout
    handleLogout,

    // Email verification
    isResendingEmail,
    handleResendVerification,
  };
};