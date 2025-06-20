"use client";

import React from "react";
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
import { useAuth } from "@/context/AuthContext";
import { useAiSuggestionBanner } from "@/hooks/useAiSuggestionBanner";

export default function BuyerDashboardPage() {
  const {
    user: userPublicProfile
  } = useAuth();

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

  if (!userPublicProfile) {
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
          <RoleToggle />
          <SettingsButton />
        </footer>
      </div>
      <Toaster />
    </div>
  );
}
