"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link"; // For Home button
import Image from "next/image"; // For notification icons

// Using Lucide Icons
import { AlertTriangle, ChevronRight, Info, ChevronLeft } from "lucide-react";

import styles from "./NotificationsPage.module.css";
import Loader from "@/app/components/shared/Loader"; // Assuming you have a Loader component
import { useAuth } from "@/context/AuthContext";

// Define an interface for notification data
interface Notification {
  id: string; // Unique ID for the notification
  type:
    | "offer"
    | "payment"
    | "gigUpdate"
    | "badge"
    | "referral"
    | "actionRequired"
    | "system"
    | string;
  message: string;
  link?: string; // Optional link to navigate to on click
  isRead: boolean;
  timestamp: string; // ISO date string
  icon?: React.ReactNode; // Allow custom icon override
}

// Mock function to fetch notifications - replace with actual API call
async function fetchNotifications(userId: string): Promise<Notification[]> {
  console.log("Fetching notifications for userId:", userId);
  // In a real app, fetch from Firestore: `users/{userId}/notifications`
  // or from a backend API: `/api/users/notifications`
  await new Promise((resolve) => setTimeout(resolve, 700)); // Simulate delay

  // Example data
  return [
    {
      id: "1",
      type: "offer",
      message: 'New gig offer: Bartender at "The Grand Event"',
      link: "/worker/offers/offer-123",
      isRead: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    {
      id: "2",
      type: "payment",
      message: 'Payment of £85.00 received for "Weekend Bar Shift"',
      link: "/worker/earnings/payment-456",
      isRead: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: "3",
      type: "gigUpdate",
      message: 'Gig "Corporate Party" details updated by buyer.',
      link: "/worker/gigs/gig-789",
      isRead: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: "4",
      type: "badge",
      message: 'You were awarded the "Top Performer" badge!',
      link: "/worker/profile#badges",
      isRead: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      id: "5",
      type: "referral",
      message: 'Your referral for "The Local Cafe" signed up!',
      link: "/user/referrals/status",
      isRead: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: "6",
      type: "actionRequired",
      message: "Action required: Update bank details for payouts.",
      link: "/user/settings#payment",
      isRead: false,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  ); // Sort by newest first
}

// Helper to get icon based on notification type
const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "offer":
    case "gigUpdate":
    case "badge":
    case "referral":
      return (
        <Image
          src="/images/notifications.svg"
          width={20}
          height={20}
          className={styles.notificationIcon}
          alt="notification icon"
        />
      );
    case "payment":
      return <Info size={20} className={styles.notificationIcon} />; // Or a currency icon
    case "actionRequired":
      return <AlertTriangle size={20} className={styles.notificationIcon} />;
    case "system":
    default:
      return <Info size={20} className={styles.notificationIcon} />;
  }
};

// Helper to format timestamp
const formatTimestamp = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(); // Older than a week, show date
};

export default function NotificationsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;

  const { user } = useAuth();
  const authUserId = user?.uid;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  useEffect(() => {
    if (user && authUserId) {
      setIsLoadingNotifications(true);
      fetchNotifications(authUserId)
        .then((data) => {
          setNotifications(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to fetch notifications:", err);
          setError("Could not load notifications. Please try again.");
        })
        .finally(() => setIsLoadingNotifications(false));
    }
  }, [user, authUserId]);

  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read (API call or local state update then sync)
    // For now, just log and navigate if link exists
    console.log("Notification clicked:", notification.id);
    if (notification.link) {
      router.push(notification.link);
    }
    // Example: Optimistically mark as read locally and then call API
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
    );
    // TODO: Call API to mark as read: await markNotificationAsRead(userId, notification.id);
  };

  const handleGoBack = () => {
    // Navigate to appropriate dashboard based on user.lastRoleUsed
    if (user?.claims.role === "BUYER") {
      router.push(`/user/${authUserId}/buyer`); // Assuming buyer dashboard path
    } else if (user?.claims.role === "GIG_WORKER") {
      router.push(`/user/${authUserId}/worker`); // Assuming worker dashboard path
    } else {
      // If lastRoleUsed is not set, or user is not available, fallback to previous page or a default
      // For now, let's try to go to select-role if user exists but no role, else back.
      if (user) {
        router.push("/select-role");
      } else {
        router.back();
      }
    }
  };

  if (!user || (authUserId && authUserId !== pageUserId)) {
    return <Loader />; // Show loader while checking auth
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.pageWrapper}>
          <header className={styles.header}>
            <button
              onClick={handleGoBack}
              className={styles.backButton}
              aria-label="Go back"
            >
              <ChevronLeft size={24} color="#fff" />
            </button>
            <h1 className={styles.pageTitle}>Notifications</h1>
          </header>

          {isLoadingNotifications ? (
            <Loader />
          ) : error ? (
            <div className={styles.emptyState}>{error}</div>
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              You have no new notifications.
            </div>
          ) : (
            <div className={styles.notificationList}>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${
                    !notification.isRead ? styles.unread : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleNotificationClick(notification)
                  }
                >
                  <div className={styles.notificationContent}>
                    {notification.icon ||
                      getNotificationIcon(notification.type)}
                    <div>
                      <span className={styles.notificationMessage}>
                        {notification.message}
                      </span>
                      <div className={styles.notificationTimestamp}>
                        {formatTimestamp(notification.timestamp)}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className={styles.chevron} />
                </div>
              ))}
            </div>
          )}

          <footer className={styles.footer}>
            <Link
              href={
                user?.claims.role === "BUYER"
                  ? `/user/${authUserId}/buyer`
                  : user?.claims.role === "GIG_WORKER"
                  ? `/user/${authUserId}/worker`
                  : `/select-role` // Fallback if role is unknown
              }
              passHref
            >
              <button className={styles.homeButton} aria-label="Go to Home">
                {/* <Home size={24} /> */}
                <Image
                  src="/images/home.svg"
                  width={24}
                  height={24}
                  className={styles.homeIcon}
                  alt="Home icon"
                />
              </button>
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
}
