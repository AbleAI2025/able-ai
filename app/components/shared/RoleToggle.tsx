"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExtendedUser } from "@/app/hooks/useAppContext";
import styles from "./RoleToggle.module.css";

const RoleToggle: React.FC<{ lastViewVisited?: string, user: ExtendedUser }> = ({
  user,
  lastViewVisited,
}) => {
  const router = useRouter();
  const currentActiveRole = user?.isBuyerMode
    ? "BUYER"
    : user?.isWorkerMode
      ? "GIG_WORKER"
      : "QA";

  const handleToggle = async (newRole: "BUYER" | "GIG_WORKER") => {
    if (newRole === currentActiveRole && !lastViewVisited) return;

    try {
      // Redirect based on the new role
      if (user?.lastRoleUsed === "BUYER" && !user?.canBeGigWorker) {
        toast.error("You cannot switch to worker mode, please complete onboarding first.");
        router.push(`/user/${user?.uid}/worker/onboarding`);
        return;
      }
      router.push(newRole === "GIG_WORKER" ? "worker" : "buyer");
    } catch (error) {
      console.error("Failed to switch role:", error);
      toast.error("Failed to switch roles. Please try again.");
    }
  };

  return (
    <div className={styles.roleToggleContainer}>
      <button
        type="button"
        className={currentActiveRole === "GIG_WORKER" ? styles.activeRole : styles.inactiveRole}
        disabled={currentActiveRole === "GIG_WORKER"}
        onClick={() => handleToggle("GIG_WORKER")}
        aria-pressed={currentActiveRole === "GIG_WORKER"}
      >
        GIGEE
      </button>
      <button
        type="button"
        className={currentActiveRole === "BUYER" ? styles.activeRole : styles.inactiveRole}
        disabled={currentActiveRole === "BUYER"}
        onClick={() => handleToggle("BUYER")}
        aria-pressed={currentActiveRole === "BUYER"}
      >
        BUYER
      </button>
    </div>
  );
};

export default React.memo(RoleToggle);
