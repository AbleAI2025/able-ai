"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const RouteTracker = () => {
  const { user } = useAuth();
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    const pathSegments = pathname.split("/");
    const roleFromPathname: "GIG_WORKER" | "BUYER" | null = 
      pathSegments.includes("worker")
        ? "GIG_WORKER"
        : pathSegments.includes("buyer")
        ? "BUYER"
        : null;
  
    if (previousPath && previousPath !== pathname && roleFromPathname) {
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
