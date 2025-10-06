"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getLastRoleUsed } from "@/lib/last-role-used";

const RouteTracker = () => {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;

    if (pathname === "/select-role" || pathname === "/") {
      return
    }

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

    if (previousPath && previousPath !== pathname && mustSave && pathname !== "/select-role" && pathname !== "/") {
      const key =
        roleFromPathname === "GIG_WORKER"
          ? "lastPathGigWorker"
          : "lastPathBuyer";

      localStorage.setItem(key, previousPath);
    }

    previousPathRef.current = pathname;
  }, [pathname, user?.claims]);

  return null;
};

export default RouteTracker;
