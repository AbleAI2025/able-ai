"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/firebase/clientApp";
import UserMgmtView from "./UserMgmtView";
import {
  handleResetPassword,
  submitNewPassword,
  handleRecoverEmail,
  handleVerifyEmail,
  handleSignIn,
} from "./usermgmtUtils";

interface UserMgmtContainerProps {
  mode: string;
  oobCode: string;
  continueUrl?: string;
}

const UserMgmtContainer: React.FC<UserMgmtContainerProps> = ({
  mode,
  oobCode,
  continueUrl,
}) => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [uiState, setUiState] = useState<
    "initial" | "inputPassword" | "success" | "error"
  >("initial");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");

  const handleResetPasswordCb = useCallback(
    (currentActionCode: string) =>
      handleResetPassword({
        authClient,
        currentActionCode,
        setUserEmail,
        setUiState,
        setMessage,
        setError,
        setIsLoading,
      }),
    []
  );

  const submitNewPasswordCb = useCallback(
    () =>
      submitNewPassword({
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
      }),
    [oobCode, newPassword, userEmail, router, continueUrl]
  );

  const handleRecoverEmailCb = useCallback(
    (currentActionCode: string) =>
      handleRecoverEmail({
        authClient,
        currentActionCode,
        setUserEmail,
        setUiState,
        setMessage,
        setError,
        setIsLoading,
      }),
    []
  );

  const handleVerifyEmailCb = useCallback(
    (currentActionCode: string, currentContinueUrl: string | undefined) =>
      handleVerifyEmail({
        authClient,
        currentActionCode,
        currentContinueUrl,
        setUiState,
        setMessage,
        setError,
        setIsLoading,
      }),
    []
  );

  const handleSignInCb = useCallback(
    (currentActionCode: string) =>
      handleSignIn({
        authClient,
        currentActionCode,
        setUiState,
        setMessage,
        setError,
        setIsLoading,
        router,
      }),
    [router]
  );

  useEffect(() => {
    switch (mode) {
      case "resetPassword":
        handleResetPasswordCb(oobCode);
        break;
      case "recoverEmail":
        handleRecoverEmailCb(oobCode);
        break;
      case "verifyEmail":
        handleVerifyEmailCb(oobCode, continueUrl);
        break;
      case "signIn":
        handleSignInCb(oobCode);
        break;
      default:
        setError(`Invalid mode: ${mode}. Please check the link.`);
        setUiState("error");
        setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    mode,
    oobCode,
    continueUrl,
    handleResetPasswordCb,
    handleRecoverEmailCb,
    handleVerifyEmailCb,
  ]);

  return (
    <UserMgmtView
      isLoading={isLoading}
      uiState={uiState}
      message={message}
      error={error}
      newPassword={newPassword}
      onPasswordChange={setNewPassword}
      onSubmitNewPassword={submitNewPasswordCb}
      onGoHome={() => router.back()}
      isSubmitDisabled={isLoading}
    />
  );
};

export default UserMgmtContainer;
