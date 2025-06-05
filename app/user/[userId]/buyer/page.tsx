"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUser } from '@/app/context/UserContext';
import Link from "next/link";
import { Toaster } from "sonner";
import Image from "next/image";
import { Users, CalendarDays, CreditCard, LayoutDashboard } from "lucide-react";

import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import { useAiSuggestionBanner } from "../../../hooks/useAiSuggestionBanner";
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
    user: userPublicProfile,
    loading: loadingAuth,
    updateUserContext,
    // TODO: Handle authError if necessary
  } = useUser();

  useEffect(() => {
    if (!loadingAuth && userPublicProfile?.isAuthenticated) {
      if (userPublicProfile?.canBeBuyer || userPublicProfile?.isQA) {
        updateUserContext({
          lastRoleUsed: "BUYER", // Ensure the context reflects the current role
          lastViewVisited: pathname, // Update last view visited
        });
      } else {
        router.replace("/select-role");
      }
    }
  }, [userPublicProfile?.isAuthenticated, userPublicProfile?.canBeBuyer, userPublicProfile?.isQA, loadingAuth, updateUserContext, pathname, router]);

  const uid = userPublicProfile?.uid;

  // AI Suggestion Banner Hook
  const {
    suggestions: aiSuggestions,
    currentIndex,
    isLoading: isLoadingSuggestions,
    error: suggestionsError,
    dismissed: suggestionsDismissed,
    dismiss: dismissSuggestions,
    refresh: refreshSuggestions,
    goToNext,
    goToPrev,
  } = useAiSuggestionBanner({
    role: "buyer",
    userId: uid || "", // Ensure userId is not undefined
    context: {
      // Example context, replace with actual data
      lastGigPosted: "2 days ago",
      activeGigs: 3,
      platformTrends: [
        "increased demand for catering",
        "more remote work options",
      ],
    },
    enabled: !!uid, // Only enable if uid is available
  });

  // Define actionItems specific to the role (Buyer)
  const actionItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard size={28} />,
      to: `/user/${uid}/buyer/profile`,
    },
    { label: "Hire", icon: <Users size={28} />, to: `/user/${uid}/buyer/gigs/new`},
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
          {uid && (
            <AiSuggestionBanner
              suggestions={aiSuggestions}
              currentIndex={currentIndex}
              isLoading={isLoadingSuggestions}
              error={suggestionsError}
              dismissed={suggestionsDismissed}
              onDismiss={dismissSuggestions}
              onRefresh={refreshSuggestions}
              goToNext={goToNext}
              goToPrev={goToPrev}
              userId={uid}
            />
          )}
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
                  width={40}
                  height={40}
                />
              </button>
            </Link>
          )}
        </header>

        <IconGrid items={actionItems} color={"#7eeef9"} />

        <ReferralBanner
          title="Refer a business and earn £5!"
          className={styles.customHover}
        />

        <footer className={styles.pageFooter}>
          <RoleToggle user={userPublicProfile} />
          <SettingsButton />
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
