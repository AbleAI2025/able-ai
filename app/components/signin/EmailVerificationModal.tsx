"use client";

import { useState } from "react";
import { sendEmailVerification } from "firebase/auth";
import { useFirebase } from "@/context/FirebaseContext";
import { toast } from "sonner";
import styles from "./EmailVerificationModal.module.css";
import { useRouter } from "next/navigation";

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  userEmail,
}) => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { authClient } = useFirebase();
  const router = useRouter();

  if (!isOpen) return null;

  const handleSendVerificationEmail = async () => {
    if (!authClient?.currentUser) return;

    try {
      setLoading(true);

      // Send email verification
      await sendEmailVerification(authClient.currentUser);

      setEmailSent(true);
      toast.success("Verification email sent successfully!");

      // Reset success state after 3 seconds
      setTimeout(() => {
        setEmailSent(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error sending verification email:", error);
      toast.error(`Error sending email: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Email Verification Required</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.iconContainer}>
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
              />
            </svg>
          </div>

          <p className={styles.modalText}>
            Please verify your email address
          </p>

          <p className={styles.emailAddress}>{userEmail}</p>

          <p className={styles.instructions}>
            Check your email inbox and click the verification link to complete
            your account setup.
          </p>

          {emailSent && (
            <div className={styles.successMessage}>
              <svg
                className={styles.checkIcon}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Email sent successfully!
            </div>
          )}

          <div className={styles.buttonGroup}>
            <button
              onClick={() => {
                onClose();
                toast.success("Redirecting to login");
                window.location.replace("/");
              }}
              disabled={loading || emailSent}
              className={`${styles.verifyButton} ${
                emailSent ? styles.success : ""
              }`}
            >
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
                    />
                  </svg>
                  I just verified, go to login
                </>
            </button>

            <button
              onClick={() => {
                onClose();
              }}
              disabled={loading || emailSent}
              className={styles.resendButton}
            >
              I'll verify later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;
