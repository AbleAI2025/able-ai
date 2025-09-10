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

export async function handleResetPassword({
  authClient,
  currentActionCode,
  setUserEmail,
  setUiState,
  setMessage,
  setError,
  setIsLoading,
}: any) {
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
}

export async function submitNewPassword({
  authClient,
  oobCode,
  newPassword,
  userEmail,
  setMessage,
  setUiState,
  setError,
  setIsLoading,
  router,
  continueUrl,
}: any) {
  if (!oobCode || !newPassword) {
    setError("Action code or new password missing.");
    return;
  }
  setIsLoading(true);
  setError(null);
  try {
    await confirmPasswordReset(authClient, oobCode, newPassword);
    setMessage(
      "Password has been reset successfully! Attempting to sign you in..."
    );
    try {
      if (!userEmail) {
        setMessage(
          "Password reset, but email not found for auto sign-in. Please sign in manually."
        );
        setUiState("success");
        return;
      }
      await signInWithEmailAndPassword(authClient, userEmail, newPassword);
      setMessage("Password reset and signed in successfully!");
      setUiState("success");
      if (continueUrl) {
        router.push(continueUrl);
      } else {
        router.push("/");
      }
    } catch (signInError: unknown) {
      console.error("Error signing in after password reset:", signInError);
      let signInErrorMessage =
        "Password reset successfully, but auto sign-in failed. Please try signing in manually.";
      if (signInError instanceof FirebaseError) {
        signInErrorMessage += ` (Error: ${signInError.message})`;
      }
      setMessage(signInErrorMessage);
      setUiState("success");
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
}

export async function handleRecoverEmail({
  authClient,
  currentActionCode,
  setUserEmail,
  setUiState,
  setMessage,
  setError,
  setIsLoading,
}: any) {
  setIsLoading(true);
  setError(null);
  try {
    const info = await checkActionCode(authClient, currentActionCode);
    const oldEmail = info.data.email;
    await applyActionCode(authClient, currentActionCode);
    setUserEmail(oldEmail || "");
    setMessage(
      `Your email has been successfully reverted to ${oldEmail}. If you did not request this, please secure your account.`
    );
    setUiState("success");
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
}

export async function handleVerifyEmail({
  authClient,
  currentActionCode,
  currentContinueUrl,
  setUiState,
  setMessage,
  setError,
  setIsLoading,
}: any) {
  setIsLoading(true);
  setError(null);
  try {
    await applyActionCode(authClient, currentActionCode);
    setMessage("Your email address has been verified successfully!");
    setUiState("success");
    if (currentContinueUrl) {
      setMessage(
        (prev: string) =>
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
}

export async function handleSignIn({
  authClient,
  currentActionCode,
  setUiState,
  setMessage,
  setError,
  setIsLoading,
  router,
}: any) {
  setIsLoading(true);
  setError(null);
  try {
    if (isSignInWithEmailLink(authClient, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
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
        router.push("/");
        return;
      }
      signInWithEmailLink(authClient, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem("emailForSignIn");
        })
        .catch(() => {});
    }
    setMessage("Your email address has been verified successfully!");
    setUiState("success");
  } catch (error: unknown) {
    console.error("Error signing in:", error);
    setError("An unexpected error occurred while signing in.");
    setUiState("error");
  }
  setIsLoading(false);
} 