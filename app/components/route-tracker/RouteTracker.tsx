"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const RouteTracker = () => {
  const pathname = usePathname();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const pathSegments = pathname.split("/");
    const roleFromPathname: "GIG_WORKER" | "BUYER" | null =
      pathSegments.includes("worker")
        ? "GIG_WORKER"
        : pathSegments.includes("buyer")
        ? "BUYER"
        : null;

    if (pathname && roleFromPathname) {
      const key =
        roleFromPathname === "GIG_WORKER"
          ? "lastPathGigWorker"
          : "lastPathBuyer";

      localStorage.setItem(key, pathname);
    }

    previousPathRef.current = pathname;
  }, [pathname]);

  return null;
};

export default RouteTracker;
