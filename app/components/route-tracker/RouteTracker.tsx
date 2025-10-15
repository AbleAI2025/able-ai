"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";

const RouteTracker = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;

    const match = pathname.match(/\/user\/([^/]+)/);
    const uidInPath = match ? match[1] : null;

    if (uidInPath && uidInPath !== user.uid) {
      const correctedPath = pathname.replace(
        `/user/${uidInPath}`,
        `/user/${user.uid}`
      );

      if (correctedPath !== pathname) {
        console.warn(
          `UID in URL (${uidInPath}) does not match the current user (${user.uid}), redirecting...`
        );

        router.replace(correctedPath);
        return;
      }
    }

    if (pathname === "/select-role" || pathname === "/") return;

    if (sessionStorage.getItem("roleSwitchInProgress")) {
      sessionStorage.removeItem("roleSwitchInProgress");
      previousPathRef.current = pathname;
      return;
    }

    const previousPath = previousPathRef.current;
    const pathSegments = pathname.split("/");

    let roleFromPathname: "GIG_WORKER" | "BUYER" | null = pathSegments.includes(
      "worker"
    )
      ? "GIG_WORKER"
      : pathSegments.includes("buyer")
      ? "BUYER"
      : null;

    if (!roleFromPathname) {
      roleFromPathname = getLastRoleUsed();
    } else {
      localStorage.setItem("lastRoleUsed", roleFromPathname);
    }

    const mustSave =
      (pathSegments.includes("worker") && roleFromPathname === "GIG_WORKER") ||
      (pathSegments.includes("buyer") && roleFromPathname === "BUYER") ||
      (!pathSegments.includes("worker") &&
        !pathSegments.includes("buyer") &&
        !!roleFromPathname);

    if (
      previousPath &&
      previousPath !== pathname &&
      mustSave &&
      pathname !== "/select-role" &&
      pathname !== "/" &&
      !pathname.includes("/onboarding-success")
    ) {
      const key =
        roleFromPathname === "GIG_WORKER"
          ? "lastPathGigWorker"
          : "lastPathBuyer";

      localStorage.setItem(key, previousPath);
    }

    previousPathRef.current = pathname;
  }, [pathname, user?.uid, loading]);

  return null;
};

export default RouteTracker;
