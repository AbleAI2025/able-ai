"use client";

import { useState, FormEvent } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import Logo from "@/app/components/brand/Logo";
import InputField from "@/app/components/form/InputField";
import SubmitButton from "@/app/components/form/SubmitButton";
import styles from "./ResetPasswordPage.module.css";
import { authClient } from "@/lib/firebase/clientApp";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(authClient, email);
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Password Reset Error:", err);
        setError(err.message || "Failed to send reset email.");
      } else {
        console.error("Password Reset Error:", err);
        setError("An unknown error occurred while sending the reset email.");
      }
    }
    setLoading(false);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>
        <div className={styles.header}>
          <h1>Reset Password</h1>
          {!success && (
            <p>
              Enter your email address and we&#39;ll send you a link to reset your
              password.
            </p>
          )}
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <p>Check your email for a link to reset your password.</p>
            <a href="/signin" className={styles.backToSignIn}>
              Back to Sign In
            </a>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleResetPassword}>
            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <InputField
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
              />
            </div>

            {error && (
              <div className={styles.errorMessage}>
                <p>{error}</p>
                <span
                  className={styles.errorCloseBtn}
                  onClick={handleCloseError}
                >
                  X
                </span>
              </div>
            )}

            <div className={styles.submitWrapper}>
              <SubmitButton loading={loading} disabled={loading}>
                Reset Password
              </SubmitButton>
            </div>
          </form>
        )}

        <a href="/signin" className={styles.toggleButton}>
          Remember your password?{" "}
          <span className={styles.linkText}>Sign In</span>
        </a>
      </div>
    </div>
  );
}
