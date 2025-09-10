"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import styles from "./RoleToggle.module.css";
import { getLastRoleUsed, setLastRoleUsed } from "@/lib/last-role-used";
import { useAuth } from "@/context/AuthContext";

const RoleToggle: React.FC<{ lastViewVisited?: string }> = ({
  lastViewVisited,
}) => {
  const router = useRouter();
  const lastRoleUsed = getLastRoleUsed();
  const { user } = useAuth();

  const userHasWorkerRole = user?.claims?.haveWorkerProfile || user?.claims?.role === "GIG_WORKER" || user?.claims?.role === "QA";

  const currentActiveRole =
    lastRoleUsed === "BUYER"
      ? "BUYER"
      : userHasWorkerRole
      ? "GIG_WORKER"
      : "BUYER";

  const handleToggle = async (newRole: "BUYER" | "GIG_WORKER") => {
    if (newRole === currentActiveRole && !lastViewVisited) return;

    try {
      if (newRole === "GIG_WORKER" && !userHasWorkerRole) {
        toast.error("You cannot switch to worker mode, please complete onboarding first.");
        router.push(`/user/${user?.uid}/worker/onboarding-ai`);
        return;
      }

      const path = `/user/${user?.uid}/${newRole === "GIG_WORKER" ? "worker" : "buyer"}`;
      await setLastRoleUsed(newRole);
      router.push(lastViewVisited || path);
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
