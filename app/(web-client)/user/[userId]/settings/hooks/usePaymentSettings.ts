"use client";

import { useState } from "react";
import { createAccountLink } from "@/app/actions/stripe/create-account-link";
import { createCustomerPortalSession } from "@/app/actions/stripe/create-customer-portal-session";
import { createAccountPortalSession } from "@/app/actions/stripe/create-portal-session";
import { FlowStep } from "@/app/types/SettingsTypes";
import { User } from "@/context/AuthContext";

export const usePaymentSettings = (userLastRole: string) => {
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const [currentStep, setCurrentStep] = useState<FlowStep>("connecting");
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeModalDismissed, setStripeModalDismissed] = useState(false);

  const handleStripeConnect = async (user: User | null) => {
    if (!user) return;

    setIsConnectingStripe(true);
    try {
      const response = await createAccountLink(user?.uid);
      if (response.error && response.status === 500)
        throw new Error(response.error);

      if (response.status === 200 && response.url) {
        window.location.href = response.url;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message || "Failed to initiate Stripe Connect.");
      } else {
        throw new Error("Failed to initiate Stripe Connect.");
      }
    } finally {
      setIsConnectingStripe(false);
    }
  };

  const handleOpenStripeConnection = async () => {
    setIsConnectingStripe(true);
    try {
      setCurrentStep("payment-method");
      setIsConnectingStripe(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new Error(err.message || "Failed to initiate Stripe Connect.");
      } else {
        throw new Error("Failed to initiate Stripe Connect.");
      }
    }
  };

  const generateCustomerPortalSession = async (user: User | null) => {
    if (!user) return;

    const createPortalSessionFunc =
      userLastRole === "BUYER"
        ? createCustomerPortalSession
        : createAccountPortalSession;
    const { url: sessionUrl, status } = await createPortalSessionFunc(user.uid);

    if (status !== 200) return;

    if (sessionUrl) window.location.href = sessionUrl;
  };

  // Handle modal close with dismissal tracking
  const handleStripeModalClose = () => {
    setShowStripeModal(false);
    setStripeModalDismissed(true);
  };

  return {
    isConnectingStripe,
    currentStep,
    showStripeModal,
    setShowStripeModal,
    stripeModalDismissed,
    setStripeModalDismissed,
    handleStripeModalClose,
    handleStripeConnect,
    handleOpenStripeConnection,
    generateCustomerPortalSession,
  };
};