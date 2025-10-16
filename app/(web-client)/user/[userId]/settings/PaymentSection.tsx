import React from "react";
import { CheckCircle, AlertTriangle } from "lucide-react";
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
  // Determine connection status based on role and enhanced status fields
  const isConnected = userLastRole === "BUYER"
    ? userSettings?.buyerConnected ?? false
    : userSettings?.workerConnected ?? false;

  // Determine capability status for warnings
  const hasCapabilityIssue = userLastRole === "BUYER"
    ? isConnected && !(userSettings?.canPay ?? true)
    : isConnected && !(userSettings?.canEarn ?? true);

  // Get appropriate warning message
  const getCapabilityWarningMessage = () => {
    if (userLastRole === "BUYER") {
      return "Your account has payment restrictions. Please resolve any outstanding issues to make payments.";
    } else {
      return "Your account has transfer restrictions. Please complete account verification to receive earnings.";
    }
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        Payment Settings - Stripe portal
      </h2>
      {!isConnected ? (
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
              : `Set up ${userLastRole === "BUYER" ? "Customer" : "Stripe Connect"
              } Account`}
          </button>
        </div>
      ) : (
        <div>
          {hasCapabilityIssue ? (
            <div className={styles.stripeStatusBannerWarning}>
              <AlertTriangle size={20} />
              {getCapabilityWarningMessage()}
              <button
                className={styles.button}
                onClick={generateCustomerPortalSession}
              >
                {userLastRole === "BUYER"
                  ? "Resolve payment issues"
                  : "Complete account setup"}
              </button>
            </div>
          ) : (
            <div className={styles.stripeStatusBannerConnected}>
              <CheckCircle size={20} />
              {userLastRole === "BUYER"
                ? "Stripe account is connected and ready for payments."
                : "Stripe account is connected and can receive payouts."}
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

          {/* Payment Method Availability Indicators */}
          <div className={styles.paymentCapabilities}>
            <h3 className={styles.capabilitiesTitle}>Payment Capabilities</h3>
            <div className={styles.capabilityList}>
              {userLastRole === "BUYER" ? (
                <>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Make Payments:</span>
                    <span className={`${styles.capabilityStatus} ${userSettings?.canPay ? styles.statusEnabled : styles.statusDisabled
                      }`}>
                      {userSettings?.canPay ? "Available" : "Restricted"}
                    </span>
                  </div>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Payment Methods:</span>
                    <span className={`${styles.capabilityStatus} ${userSettings?.canPay ? styles.statusEnabled : styles.statusDisabled
                      }`}>
                      {userSettings?.canPay ? "Cards & Bank Transfers" : "Not Available"}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Receive Earnings:</span>
                    <span className={`${styles.capabilityStatus} ${userSettings?.canEarn ? styles.statusEnabled : styles.statusDisabled
                      }`}>
                      {userSettings?.canEarn ? "Available" : "Restricted"}
                    </span>
                  </div>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Payout Methods:</span>
                    <span className={`${styles.capabilityStatus} ${userSettings?.canEarn ? styles.statusEnabled : styles.statusDisabled
                      }`}>
                      {userSettings?.canEarn ? "Bank Transfer" : "Not Available"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {userLastRole === "GIG_WORKER" &&
            <>
              <div className={styles.paymentCapabilities}>
                <h3 className={styles.capabilitiesTitle}>Account Information</h3>
                <div className={styles.capabilityList}>
                  {[
                    { label: 'Charges Enabled', value: userSettings?.chargesEnabled, enabledText: 'Active', disabledText: 'Inactive' },
                    { label: 'Payouts Enabled', value: userSettings?.payoutsEnabled, enabledText: 'Active', disabledText: 'Inactive' },
                    { label: 'Account Details', value: userSettings?.hasAccountDetails, enabledText: 'Complete', disabledText: 'Incomplete' },
                  ].map(({ label, value, enabledText, disabledText }) => (
                    <div className={styles.capabilityItem} key={label}>
                      <span className={styles.capabilityLabel}>{label}:</span>
                      <span className={`${styles.capabilityStatus} ${value ? styles.statusEnabled : styles.statusDisabled}`}>
                        {value ? enabledText : disabledText}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.paymentCapabilities}>
                <h3 className={styles.capabilitiesTitle}>Account Status</h3>
                <div className={styles.capabilityList}>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Country:</span>
                    <span>
                      {userSettings?.country || 'N/A'}
                    </span>
                  </div>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Currency:</span>
                    <span>
                      {userSettings?.currency?.toLocaleUpperCase() || 'N/A'}
                    </span>
                  </div>
                  <div className={styles.capabilityItem}>
                    <span className={styles.capabilityLabel}>Business Type:</span>
                    <span>
                      {
                        userSettings?.businessType ?
                          userSettings.businessType.charAt(0).toUpperCase() + userSettings.businessType.slice(1) :
                          'N/A'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </>
          }
        </div>
      )}
    </section>
  );
};