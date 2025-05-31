"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Logo from "@/app/components/brand/Logo";
import ActionButton from "./ActionButton";
import styles from "./SelectRolePage.module.css";
import Loader from "@/app/components/shared/Loader";
import { toast } from "sonner";

export default function SelectRolePage() {
  const router = useRouter();
  const { updateUserContext, isLoading: loadingAuth, user } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or auth state is still loading
  useEffect(() => {
    if (!loadingAuth && user?.isAuthenticated === false) {
      router.push("/signin");
    }
    if (!loadingAuth && user?.isAuthenticated) {
      if (user?.isBuyerMode) {
        if (user?.lastViewVisitedBuyer) {
          router.push(user?.lastViewVisitedBuyer);
        } else {
          router.push(`user/${user?.uid || 'this_user'}/buyer`);
        }
      }
      if (user?.canBeGigWorker && user?.isWorkerMode) {
        if (user?.lastViewVisitedWorker) {
          router.push(user?.lastViewVisitedWorker);
        } else {
          router.push(`user/${user?.uid || 'this_user'}/worker`);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAuthenticated, loadingAuth, router]);

  const handleRoleSelection = async (role: "BUYER" | "GIG_WORKER") => {
    if (!updateUserContext) {
      setError("User context is not available. Please try again.");
      console.error(
        "updateUserContext function is not available from useAppContext."
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await updateUserContext({ lastRoleUsed: role });

      if (role === "BUYER") {
        if (user?.canBeBuyer) {
          if (user?.lastViewVisitedBuyer) {
            router.push(user?.lastViewVisitedBuyer);
          }
          router.push(`user/${user?.uid || 'this_user'}/buyer/gigs/new`);
        } else {
          toast.error(
            "You are not eligible to be a buyer. Please contact support."
          );
          setIsLoading(false);
        }
      } else if (role === "GIG_WORKER") {
        if (user?.canBeGigWorker) {
          router.push(`user/${user?.uid || 'this_user'}/worker`);
        } else {
          router.push(`user/${user?.uid || 'this_user'}/worker/onboarding`);
        }
      }
    } catch (err) {
      console.error("Error setting role:", err);
      setError("Failed to set your role. Please try again.");
      setIsLoading(false);
    }
  };

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logoWrapper}>
          <Logo />
        </div>

        <div className={styles.greeting}>
          <p className={styles.intro}>
            Hello, I&apos;m Able, it&apos;s lovely to meet you.
          </p>
          <p className={styles.question}>What do you want to do today?</p>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <div className={styles.actions}>
          <ActionButton
            bgColor="#7eeef9" // Light blue for "Hire"
            onClick={() => handleRoleSelection("BUYER")}
            disabled={isLoading}
          >
            Hire a Gig Worker
          </ActionButton>
          <ActionButton
            bgColor="#41a1e8" // Darker blue for "Find Work"
            onClick={() => handleRoleSelection("GIG_WORKER")}
            disabled={isLoading}
          >
            Find Gig Work
          </ActionButton>
        </div>

        <p className={styles.note}>
          We are focusing on hospitality and events gigs right now... but add
          all your skills and watch this space as we enable gig work across
          industries.
        </p>
      </div>
    </div>
  );
}
