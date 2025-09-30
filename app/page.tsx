"use client";

import { useEffect, useState } from "react";
import { toast } from 'sonner';
import Logo from "@/app/components/brand/Logo";
import styles from "./SignInPage.module.css";
import SignInView from "@/app/components/signin/SignInView";
import RegisterView from "@/app/components/signin/RegisterView";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useFirebase } from "@/context/FirebaseContext";
import EmailVerificationGuard from "@/components/auth/EmailVerificationGuard";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: loadingAuth} = useAuth();
  const { authClient } = useFirebase();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (!loadingAuth && user && user.emailVerification?.isVerified) {
      toast.success(`Welcome back ${user?.displayName || user?.email || 'user'}!`);
      router.push("/select-role");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralCode = params.get('code');

    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
      toast.info(`Referral code "${referralCode}" has been saved!`);
    }
  }, []);

  // Handle email verification when user returns from email link
  useEffect(() => {
    const handleEmailVerificationReturn = async () => {
      if (authClient && isSignInWithEmailLink(authClient, window.location.href)) {
        try {
          let email = window.localStorage.getItem("emailForSignIn");
          if (!email) {
            // If no email in localStorage, try to get it from URL params
            const params = new URLSearchParams(window.location.search);
            email = params.get('email') || '';
          }
          
          if (email) {
            await signInWithEmailLink(authClient, email, window.location.href);
            window.localStorage.removeItem("emailForSignIn");
            
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
            
            toast.success("Email verified successfully! Redirecting...");
            
            // The auth state change will handle the redirect
          }
        } catch (error) {
          console.error("Error handling email verification:", error);
          toast.error("Failed to verify email. Please try again.");
        }
      }
    };

    handleEmailVerificationReturn();
  }, [authClient]);

  const handleCloseError = () => {
    setError(null);
  };

  const handleToggleRegister = () => {
    setIsRegistering(!isRegistering);
    setError(null); // Clear error when switching views
  };

  return (
    <EmailVerificationGuard requireVerification={false}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logoWrapper}>
            <Logo />
          </div>
          <div className={styles.header}>
            <h1>
              {isRegistering ? (
                <>
                  <span>Welcome!</span>
                  <br />
                  <span>Please register to get started</span>
                </>
              ) : (
                "Welcome back!"
              )}
            </h1>
          </div>

          {/* Render either SignInView or RegisterView */}
          {isRegistering ? (
            <RegisterView
              onToggleRegister={handleToggleRegister}
              onError={setError}
            />
          ) : (
            <SignInView
              onToggleRegister={handleToggleRegister}
              onError={setError}
            />
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
              <span className={styles.errorCloseBtn} onClick={handleCloseError}>
                X
              </span>
            </div>
          )}

        </div>
      </div>
    </EmailVerificationGuard>
  );
}
