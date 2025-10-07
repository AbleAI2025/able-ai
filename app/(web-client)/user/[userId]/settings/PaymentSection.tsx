import React from "react";
import { CheckCircle } from "lucide-react";
import styles from "./SettingsPage.module.css";
import { UserSettingsData, UserRole } from "@/app/types/SettingsTypes";

interface PaymentSectionProps {
  userLastRole: UserRole;
  userSettings: UserSettingsData | null;
  handleStripeConnect: () => void;
  isConnectingStripe: boolean;
  generateCustomerPortalSession: () => void;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({
  userLastRole,
  userSettings,
  handleStripeConnect,
  isConnectingStripe,
  generateCustomerPortalSession,
}) => {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Payment Settings - Stripe portal
      </h2>
      {(userLastRole === "GIG_WORKER" &&
        !userSettings?.stripeConnectAccountId) ||
      (userLastRole === "BUYER" && !userSettings?.stripeCustomerId) ? (
        <div className={styles.stripePrompt}>
          <p>
            To{" "}
            {userLastRole === "BUYER"
              ? "hire gig workers"
              : "receive payments for your gigs"}
            , you need to set up your{" "}
            {userLastRole === "BUYER" ? "customer" : "Stripe Connect"}{" "}
            account with Stripe, our secure payment provider.
          </p>
          <button
            onClick={handleStripeConnect}
            className={styles.button}
            disabled={isConnectingStripe}
          >
            {isConnectingStripe
              ? "Redirecting..."
              : `Set up ${
                  userLastRole === "BUYER" ? "Customer" : "Stripe Connect"
                } Account`}
          </button>
        </div>
      ) : (
        <div className={styles.stripeStatusBannerConnected}>
          <CheckCircle size={20} /> Stripe account is connected and can
          receive payouts.
          <button
            className={styles.button}
            onClick={generateCustomerPortalSession}
          >
            {userLastRole === "BUYER"
              ? "Go to buyer portal"
              : "Go to worker portal"}
          </button>
        </div>
      )}
    </section>
  );
};