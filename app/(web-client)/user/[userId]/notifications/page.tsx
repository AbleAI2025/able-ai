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
import { getAllNotificationsAction, updateNotificationStatusAction } from "@/actions/notifications/notifications";
import { Notification, NotificationType } from "@/app/types/NotificationTypes";
import ScreenHeaderWithBack from "@/app/components/layout/ScreenHeaderWithBack";


// Helper to get icon based on notification type
const getNotificationIcon = (type: Notification["type"]) => {
  if (!type) return null;
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

export interface ClientNotification {
  id: string;
  type: NotificationType;
  message: string;
  link?: string;
  isRead: boolean;
  icon?: string;
  timestamp: string; // ISO string
}


export default function NotificationsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const { user } = useAuth();
  const authUserToken = user?.token;
  const authUserId = user?.uid;

  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchNotifications(token: string) {
    const { notifications } = await getAllNotificationsAction(token);

    return notifications
      .map((n: Notification) => ({
        id: n.id,
        type: n.type ?? "system",
        message: n.title ?? "No title",
        link: n.path ?? undefined,
        isRead: n.status !== "unread",
        timestamp: n.createTime ?? new Date().toISOString(),
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  // Fetch notifications
  useEffect(() => {
    if (user && authUserToken) {
      setIsLoadingNotifications(true);
      fetchNotifications(authUserToken)
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
  }, [user, authUserToken]);

  const handleNotificationClick = async(notification: ClientNotification) => {

    if (notification.link) {
      router.push(notification.link);
    }

    await updateNotificationStatusAction(notification.id, "read")
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
        <ScreenHeaderWithBack title="Notifications" onBackClick={handleGoBack} />
        <div className={styles.pageWrapper}>
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
                    {notification?.icon ||
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
