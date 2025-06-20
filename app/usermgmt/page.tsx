"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  verifyPasswordResetCode,
  confirmPasswordReset,
  checkActionCode,
  applyActionCode,
  signInWithEmailAndPassword,
  signInWithEmailLink,
  isSignInWithEmailLink,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import styles from "./usermgmt.module.css";
import { authClient } from "@/lib/firebase/clientApp";

const UserMgmtPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [actionCode, setActionCode] = useState<string | null>(null);
  const [continueUrl, setContinueUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<
    "initial" | "inputPassword" | "success" | "error"
  >("initial");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");

  const handleResetPassword = useCallback(async (currentActionCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const email = await verifyPasswordResetCode(authClient, currentActionCode);
      setUserEmail(email);
      setUiState("inputPassword");
      setMessage(
        `Resetting password for ${email}. Please enter your new password.`
      );
    } catch (err: unknown) {
      console.error("Error verifying password reset code:", err);
      if (err instanceof FirebaseError) {
        setError(
          err.message ||
            "Invalid or expired action code. Please try resetting your password again."
        );
      } else {
        setError(
          "An unexpected error occurred while verifying the password reset code."
        );
      }
      setUiState("error");
    }
    setIsLoading(false);
  }, []);

  const submitNewPassword = async () => {
    if (!actionCode || !newPassword) {
      setError("Action code or new password missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(authClient, actionCode, newPassword);
      setMessage(
        "Password has been reset successfully! Attempting to sign you in..."
      );
      try {
        if (!userEmail) {
          // This case should ideally not happen if verifyPasswordResetCode was successful
          setMessage(
            "Password reset, but email not found for auto sign-in. Please sign in manually."
          );
          setUiState("success"); // Still a success for password reset
          return;
        }
        await signInWithEmailAndPassword(authClient, userEmail, newPassword);
        setMessage("Password reset and signed in successfully!");
        setUiState("success");
        if (continueUrl) {
          router.push(continueUrl); // Redirect if continueUrl is available
        } else {
          router.push("/"); // Redirect to homepage or dashboard
        }
      } catch (signInError: unknown) {
        console.error("Error signing in after password reset:", signInError);
        let signInErrorMessage =
          "Password reset successfully, but auto sign-in failed. Please try signing in manually.";
        if (signInError instanceof FirebaseError) {
          signInErrorMessage += ` (Error: ${signInError.message})`;
        }
        setMessage(signInErrorMessage);
        setUiState("success"); // Password reset was successful, sign-in is secondary
      }
    } catch (err: unknown) {
      console.error("Error confirming password reset:", err);
      if (err instanceof FirebaseError) {
        setError(
          err.message ||
            "Failed to reset password. The code might have expired or the password is too weak."
        );
      } else {
        setError(
          "An unexpected error occurred while confirming the password reset."
        );
      }
      setUiState("error");
    }
    setIsLoading(false);
  };

  const handleRecoverEmail = useCallback(async (currentActionCode: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const info = await checkActionCode(authClient, currentActionCode);
      const oldEmail = info.data.email; // Email being restored
      await applyActionCode(authClient, currentActionCode);
      setUserEmail(oldEmail || "");
      setMessage(
        `Your email has been successfully reverted to ${oldEmail}. If you did not request this, please secure your account.`
      );
      setUiState("success");
      // Optionally offer to send a password reset email to the restored email
      // auth.sendPasswordResetEmail(oldEmail);
    } catch (err: unknown) {
      console.error("Error recovering email:", err);
      if (err instanceof FirebaseError) {
        setError(
          err.message ||
            "Invalid or expired action code. Unable to recover email."
        );
      } else {
        setError("An unexpected error occurred while recovering the email.");
      }
      setUiState("error");
    }
    setIsLoading(false);
  }, []);

  const handleVerifyEmail = useCallback(
    async (currentActionCode: string, currentContinueUrl: string | null) => {
      setIsLoading(true);
      setError(null);
      try {
        await applyActionCode(authClient, currentActionCode);
        setMessage("Your email address has been verified successfully!");
        setUiState("success");
        if (currentContinueUrl) {
          // router.push(currentContinueUrl); // Or provide a button
          setMessage(
            (prev) =>
              prev +
              ` You will be redirected shortly if a continue URL was provided, or click here: <a href='${currentContinueUrl}'>Continue</a>`
          );
        }
      } catch (err: unknown) {
        console.error("Error verifying email:", err);
        if (err instanceof FirebaseError) {
          setError(
            err.message ||
              "Invalid or expired action code. Please try verifying your email again."
          );
        } else {
          setError("An unexpected error occurred while verifying the email.");
        }
        setUiState("error");
      }
      setIsLoading(false);
    },
    []
  );

  // https://blog.logrocket.com/send-custom-email-templates-firebase-react-express/
  const handleSignIn = useCallback(
    async (currentActionCode: string ) => {
      setIsLoading(true);
      setError(null);
      try {
        if (isSignInWithEmailLink(authClient, window.location.href)) {
          // Additional state parameters can also be passed via URL.
          // This can be used to continue the user's intended action before triggering
          // the sign-in operation.
          // Get the email if available. This should be available if the user completes
          // the flow on the same device where they started it.
          let email = window.localStorage.getItem("emailForSignIn");
          if (!email) {
            // User opened the link on a different device. To prevent session fixation attacks,
            const info = await checkActionCode(authClient, currentActionCode);
            const firebaseEmail = info.data.email;
            if (firebaseEmail) {
              email = firebaseEmail;
            } else {
              email = window.prompt(
                "Please provide your email for confirmation"
              );
            }
          }
          if (!email) {
            setError("No email found. Please try signing in manually.");
            setUiState("error");
            setIsLoading(false);
            router.push("/signin");
            return;
          }
          // The client SDK will parse the code from the link for you.
          signInWithEmailLink(authClient, email, window.location.href)
            .then(() => {
              // Clear email from storage.
              window.localStorage.removeItem("emailForSignIn");
              // You can access the new user by importing getAdditionalUserInfo
              // and calling it with result:
              // getAdditionalUserInfo(result)
              // You can access the user's profile via:
              // getAdditionalUserInfo(result)?.profile
              // You can check if the user is new or existing:
              // getAdditionalUserInfo(result)?.isNewUser
            })
            .catch(() => {
              // Some error occurred, you can inspect the code: error.code
              // Common errors could be invalid email and invalid or expired OTPs.
            });
        }
        setMessage("Your email address has been verified successfully!");
        setUiState("success");
      } catch (error: unknown) {
        console.error("Error signing in:", error);
        setError("An unexpected error occurred while signing in.");
        setUiState("error");
      }
      setIsLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const modeParam = searchParams.get("mode");
    const actionCodeParam = searchParams.get("oobCode");
    const continueUrlParam = searchParams.get("continueUrl");
    // const langParam = searchParams.get('lang');

    setActionCode(actionCodeParam);
    setContinueUrl(continueUrlParam);

    if (!actionCodeParam) {
      setError("Missing required parameters (action code) in the URL.");
      setUiState("error");
      setIsLoading(false);
      return;
    }

    setMessage(`Processing your request for mode: ${modeParam}...`);

    switch (modeParam) {
      case "resetPassword":
        handleResetPassword(actionCodeParam);
        break;
      case "recoverEmail":
        handleRecoverEmail(actionCodeParam);
        break;
      case "verifyEmail":
        handleVerifyEmail(actionCodeParam, continueUrlParam);
        break;
      case "signIn":
        handleSignIn(actionCodeParam);
        break;
      default:
        setError(`Invalid mode: ${modeParam}. Please check the link.`);
        setUiState("error");
        setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams,
    handleResetPassword,
    handleRecoverEmail,
    handleVerifyEmail,
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Account Management</h1>
        {isLoading && (
          <p className={styles.loadingText}>Loading... {message}</p>
        )}

        {!isLoading && uiState === "initial" && message && (
          <p className={styles.message}>{message}</p>
        )}

        {uiState === "inputPassword" && (
          <div>
            <p className={styles.message}>{message}</p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              className={styles.input}
            />
            <button
              onClick={submitNewPassword}
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save New Password"}
            </button>
          </div>
        )}

        {uiState === "success" && (
          <p
            className={styles.successMessage}
            dangerouslySetInnerHTML={{ __html: message }}
          ></p>
        )}
        {uiState === "error" && error && (
          <p className={styles.errorMessage}>Error: {error}</p>
        )}

        {!isLoading && (uiState === "success" || uiState === "error") && (
          <button
            onClick={() => router.push("/")}
            className={styles.homeButton}
          >
            Go to Homepage
          </button>
        )}
      </div>
    </div>
  );
};

const UserMgmt = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserMgmtPage />
    </Suspense>
  );
};

export default UserMgmt;
