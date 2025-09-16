"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Import shared components
import AiSuggestionBanner from "@/app/components/shared/AiSuggestionBanner";
import IconGrid from "@/app/components/shared/IconGrid";
import ReferralBanner from "@/app/components/shared/ReferralBanner";
import RoleToggle from "@/app/components/shared/RoleToggle";
import SettingsButton from "@/app/components/shared/SettingsButton";
import WorkerGigRequestAICard from "@/app/components/shared/WorkerGigRequestAICard";

// Import Lucide icons as needed for the specific dashboard
import {
  UserCircle,
  Briefcase,
  CalendarCheck2,
  DollarSign,
  MessageCircle,
} from "lucide-react";

import styles from "./HomePage.module.css";
import Image from "next/image";
import Loader from "@/app/components/shared/Loader";
import Logo from "@/app/components/brand/Logo";
import { useAuth } from "@/context/AuthContext";
import { useAiSuggestionBanner } from "@/hooks/useAiSuggestionBanner";
import {
  resetUnreadCountInDB,
} from "@/actions/notifications/useUnreadNotifications";
import { getAllNotificationsAction } from "@/actions/notifications/notifications";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import Notification from "@/app/components/shared/Notification";


export default function WorkerDashboardPage() {
  const params = useParams();
  const pageUserId = params.userId as string;
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user } = useAuth();
  const authUserToken = user?.token;
  const router = useRouter();

  async function fetchNotifications(token: string) {
    const { notifications, unreadCount } = await getAllNotificationsAction(token);
    
    setUnreadNotifications(unreadCount);
    return notifications;
  }

  useEffect(() => {
    if (authUserToken) {
      fetchNotifications(authUserToken)
        .catch((err) => {
          console.error("Failed to fetch notifications:", err);
        })
    }
  }, [authUserToken]);

  const handleClick = async () => {
    await resetUnreadCountInDB();
    setUnreadCount(0);
  };

  const authUserId = user?.uid;

  // Use authUserId for subsequent operations after validation
  const uid = authUserId;

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
    role: "worker",
    userId: uid || "", // Provide fallback for undefined uid
    // enabled: true, // Removed duplicate enabled property
    context: {
      // Example context for worker, replace with actual relevant data
      profileCompletion: 0.7,
      recentActivity: "applied for 2 gigs",
      platformTrends: [
        "high demand for photographers",
        "weekend shifts available",
      ],
    },
    enabled: !!uid, // Only enable if uid is available
  });

  // Define actionItems specific to the role (Worker)
  const actionItems = [
    {
      label: "Gigfolio",
      icon: <UserCircle size={28} />,
      to: `/user/${uid}/worker/profile`,
    },
    {
      label: "Offers",
      icon: <Briefcase size={28} />,
      to: `/user/${uid}/worker/offers`,
    },
    {
      label: "Calendar & Gigs",
      icon: <CalendarCheck2 size={28} />,
      to: `/user/${uid}/worker/calendar`,
    },
    {
      label: "Earnings & History",
      icon: <DollarSign size={28} />,
      to: `/user/${uid}/worker/earnings`,
    },
  ];

  // Optional: Fetch summary data for upcoming gigs/offers
  // const [summaryData, setSummaryData] = useState<UpcomingGigSummary[]>([]);
  // useEffect(() => {
  //   if (isAuthenticated && currentActiveRole === THIS_HOME_ROLE) {
  //     // API call to fetch summary data
  //   }
  // }, [isAuthenticated, currentActiveRole, THIS_HOME_ROLE]);

  // Show loader if auth is loading, or if user is not authenticated (as redirect will happen)
  // or if pageUserId is not the authenticated user's ID (again, redirect will happen)
  if (!user || (user && authUserId !== pageUserId)) {
    return <Loader />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <ScreenHeaderWithBack
          isHomePage
          handleClick={handleClick}
          unreadCount={unreadCount}
          unreadNotifications={unreadNotifications}
        />
        {uid && (
            <AiSuggestionBanner
              suggestions={aiSuggestions}
              currentIndex={currentIndex}
              isLoading={isLoadingSuggestions}
              error={suggestionsError}
              dismissed={suggestionsDismissed} // Pass the dismissed state
              onDismiss={dismissSuggestions}
              onRefresh={refreshSuggestions}
              goToNext={goToNext}
              goToPrev={goToPrev}
              userId={uid}
            />
          )}
        <main className={styles.contentWrapper}>
          <IconGrid items={actionItems} />
          <ReferralBanner />
        </main>
        <footer className={styles.pageFooter}>
          <RoleToggle />
          <SettingsButton />
        </footer>
      </div>
    </div>
  );
}
