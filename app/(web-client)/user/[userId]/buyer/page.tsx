"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, CalendarDays, CreditCard, LayoutDashboard, MessageCircle } from "lucide-react";

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
import {
  getUnreadCountFromDB,
  resetUnreadCountInDB,
} from "@/actions/notifications/useUnreadNotifications";
import { getAllNotificationsAction } from "@/actions/notifications/notifications";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";
import { useRouter } from "next/navigation";

export default function BuyerDashboardPage() {
  const { user: userPublicProfile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const authUserToken = user?.token;

  async function fetchNotifications(token: string) {
    const { unreadCount } = await getAllNotificationsAction(token);

    setUnreadNotifications(unreadCount);
  }

  useEffect(() => {
    getUnreadCountFromDB().then(setUnreadCount).catch(console.error);
  }, []);

  const handleClick = async () => {
    await resetUnreadCountInDB();
    setUnreadCount(0);
  };

  const uid = userPublicProfile?.uid;

  useEffect(() => {
    if (user && authUserToken) {
      fetchNotifications(authUserToken)
        .catch((err) => {
          console.error("Failed to fetch notifications:", err);
        })
    }
  }, [user, authUserToken]);

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
    {
      label: "Hire",
      icon: <Users size={28} />,
      to: `/user/${uid}/buyer/gigs/new`,
    },
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
       <ScreenHeaderWithBack
          isHomePage
          onBackClick={() => router.back()}
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
          

          {/* <h2 className={styles.sectionTitle}>Manage Your Activity</h2> */}
           <IconGrid items={actionItems} color={"#7eeef9"} />

          {/* Optional Summary Section - Example Structure
          {summaryData.length > 0 && (
            <section className={styles.summarySection}>
              <h2 className={styles.sectionTitle}>
                Your Next Gig
              </h2>
              <ul className={styles.summaryList}>
                {summaryData.slice(0,3).map(item => ( // Show first 3
                    <li key={item.id}><Link href={item.link}>{item.title} with {item.partnerName} on {item.dateTime}</Link></li>
                ))}
              </ul>
              {summaryData.length > 3 && <Link href='/worker/calendar' className={styles.viewAllLink}>View All</Link>>}
            </section>
          )}
          */}

          <ReferralBanner
            title="Refer a business and earn £5!"
            className={styles.customHover}
          />
        </main> 
         <footer className={styles.pageFooter}>
            <RoleToggle />
            <SettingsButton />
          </footer>
      </div>
    </div>
  );
}
