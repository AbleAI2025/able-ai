"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/app/hooks/useAppContext";
import Link from "next/link";
import { Toaster } from "sonner";
import Image from "next/image";
import { Users, CalendarDays, CreditCard, LayoutDashboard } from "lucide-react";

import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import IconGrid from "@/app/components/shared/IconGrid";
import ReferralBanner from "@/app/components/shared/ReferralBanner";
import RoleToggle from "@/app/components/shared/RoleToggle";
import SettingsButton from "@/app/components/shared/SettingsButton";
import Loader from "@/app/components/shared/Loader";
import Logo from "@/app/components/brand/Logo";

import styles from "./HomePage.module.css";

export default function BuyerDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    isLoading: loadingAuth,
    user: userPublicProfile,
    updateUserContext,
  } = useAppContext();

  useEffect(() => {
    if (!loadingAuth && userPublicProfile?.isAuthenticated) {
      if (userPublicProfile?.canBeBuyer) {
        updateUserContext({
          lastRoleUsed: "BUYER", // Ensure the context reflects the current role
          lastViewVisited: pathname, // Update last view visited
        });
      } else {
        router.replace("/select-role");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPublicProfile?.isAuthenticated, loadingAuth]);

  const uid = userPublicProfile?.uid;

  // Define actionItems specific to the role (Buyer)
  const actionItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={28} />,
      to: `/user/${uid}/buyer/analytics`,
    },
    { label: "Hire", icon: <Users size={28} />, to: "/onboard-buyer" },
    {
      label: "Calendar & Gigs",
      icon: <CalendarDays size={28} />,
      to: `/user/${uid}/buyer/calendar`,
    },
    {
      label: "Payments & History",
      icon: <CreditCard size={28} />,
      to: `/user/${uid}/buyer/payments`,
    },
  ];

  if (loadingAuth || !userPublicProfile?.isAuthenticated) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <header className={styles.pageHeader}>
          <Logo width={60} height={60} />
          {/* Notification Icon */}
          {userPublicProfile?.uid && (
            <Link
              href={`/user/${userPublicProfile.uid}/notifications`}
              passHref
            >
              <button
                className={styles.notificationButton}
                aria-label="Notifications"
              >
                <Image
                  src="/images/notifications.svg"
                  alt="Notifications"
                  width={45}
                  height={45}
                />
              </button>
            </Link>
          )}
        </header>

        <AiSuggestionBanner
          message="We have 10 new bartenders who joined within 5 miles of you - would you like to see their profiles?"
        />

        <IconGrid items={actionItems} color={"#7eeef9"} />

        <ReferralBanner
          title="Refer a business and earn £5!"
          className={styles.customHover}
        />

        <footer className={styles.pageFooter}>
          <RoleToggle user={userPublicProfile}/>
          <SettingsButton />
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
