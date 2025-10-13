import React from "react";
import { AlertTriangle } from "lucide-react";
import styles from "./SettingsPage.module.css";
import { User } from "@/context/AuthContext";

interface EmailVerificationSectionProps {
  user: User | null;
  handleResendVerification: () => void;
  isResendingEmail: boolean;
}

export const EmailVerificationSection: React.FC<EmailVerificationSectionProps> = ({
  user,
  handleResendVerification,
  isResendingEmail,
}) => {
  if (!user || user.emailVerified) return null;

  return (
    <div className={styles.verificationSection}>
      <div className={styles.verificationHeader}>
        <AlertTriangle className={styles.warningIcon} />
        <h2 className={styles.verificationModalTitle}>
          Verify Your Email Address
        </h2>
      </div>
      <p className={styles.verificationText}>
        To secure your account and access all features, please verify
        your email address. A verification link has been sent to{" "}
        <strong>{user.email}</strong>.
      </p>
      <div className={styles.verificationActions}>
        <button
          onClick={handleResendVerification}
          className={styles.resendButton}
          disabled={isResendingEmail}
        >
          {isResendingEmail ? (
            <>
              <svg
                className={styles.spinnerIcon}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Sending...
            </>
          ) : (
            <>
              <svg
                className={styles.emailIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              Resend Verification Email
            </>
          )}
        </button>
      </div>
    </div>
  );
};