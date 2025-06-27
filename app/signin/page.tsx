"use client";

import { useEffect, useState } from "react";
import { toast } from 'sonner';
import Logo from "@/app/components/brand/Logo";
import styles from "./SignInPage.module.css";
import SignInView from "@/app/signin/SignInView";
import RegisterView from "@/app/signin/RegisterView";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function SignInPage() {
  const router = useRouter();
  const { user, loading: loadingAuth} = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    if (!loadingAuth && user) {
      toast.success(`Welcome back ${user?.displayName || user?.email || 'user'}!`);
      router.push("/select-role");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth]);

  const handleCloseError = () => {
    setError(null);
  };

  const handleToggleRegister = () => {
    setIsRegistering(!isRegistering);
    setError(null); // Clear error when switching views
  };

  return (
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
  );
}
