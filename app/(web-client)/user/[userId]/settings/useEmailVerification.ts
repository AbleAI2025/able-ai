"use client";

import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "sonner";
import { User } from "@/context/AuthContext";

export const useEmailVerification = () => {
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  const handleResendVerification = async (user: User | null) => {
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
    isResendingEmail,
    handleResendVerification,
  };
};