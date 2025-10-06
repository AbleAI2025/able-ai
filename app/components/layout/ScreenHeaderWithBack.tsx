import React from "react";
import { ArrowLeft } from "lucide-react";
import styles from "./ScreenHeaderWithBack.module.css";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Logo from "../brand/Logo";
import { usePathname, useRouter } from "next/navigation";
import Notification from "../shared/Notification";
import Image from "next/image";
import { detectPageContext, getContextForURL } from "@/lib/context-detection";
import { getLastRoleUsed } from "@/lib/last-role-used";

type OtherpageProps = {
  isHomePage?: boolean;
  title?: string;
  onBackClick?: () => void;
};

type HomePageProps = {
  isHomePage: boolean;
  title?: string;
  onBackClick: () => void;
  handleClick: () => void;
  unreadCount: number;
  unreadNotifications: number;
};

type ScreenHeaderWithBackProps = HomePageProps | OtherpageProps;

const ScreenHeaderWithBack: React.FC<ScreenHeaderWithBackProps> = (props) => {
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const lastRoleUsed = getLastRoleUsed();
  const {
    isHomePage,
    title,
    onBackClick,
    handleClick,
    unreadCount,
    unreadNotifications,
  } = props as HomePageProps;

  const isChatPage = pathname.includes("/able-ai");

  // Generate context-aware chat URL
  const getChatUrl = () => {
    if (!user?.uid) return "#";

    const baseUrl = `/user/${user.uid}/able-ai`;

    // Don't add context if already on chat page
    if (isChatPage) return baseUrl;

    // Detect current page context
    const context = detectPageContext(pathname);

    // Use simplified context parameter
    if (context.contextId) {
      const contextParams = getContextForURL(context);
      const queryParams = new URLSearchParams();

      // Add context ID
      queryParams.set("context", context.contextId);

      // Add gigId if present
      if (contextParams.gigId) {
        queryParams.set("gigId", contextParams.gigId);
      }

      return `${baseUrl}?${queryParams.toString()}`;
    }

    return baseUrl;
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
      return;
    }
    if (lastRoleUsed === "BUYER") {
      const lastPathBuyer = localStorage.getItem("lastPathBuyer");
      if (lastPathBuyer && lastPathBuyer !== pathname) {
        router.push(lastPathBuyer);
        return;
      }
      router.push(`/user/${user?.uid}/buyer`);
      return;
    }

    if (lastRoleUsed === "GIG_WORKER") {
      const lastPathGigWorker = localStorage.getItem("lastPathGigWorker");
      if (lastPathGigWorker && lastPathGigWorker !== pathname) {
        router.push(lastPathGigWorker);
        return;
      }
      router.push(`/user/${user?.uid}/worker`);
      return;
    }

    if (window.history.length > 1) {
      router.back();
    } else if (user?.token) {
      router.push("/select-role");
    } else {
      router.push("/");
    }
  };

  return (
    <header className={styles.header}>
      {!isHomePage ? (
        <button
          onClick={handleBackClick}
          className={styles.backButton}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <Image src="/images/home.svg" alt="Back" width={40} height={40} />
      )}
      {title && <h1 className={styles.title}>{title}</h1>}
      <Link href={getChatUrl()} className={styles.chat}>
        {!isChatPage ? (
          <>
            <span>Chat with Able</span>
            <Logo width={30} height={30} />
          </>
        ) : (
          <Logo width={40} height={40} />
        )}
      </Link>
      {isHomePage && (
        <Notification
          uid={user?.uid}
          handleClick={handleClick}
          unreadCount={unreadCount}
          unreadNotifications={unreadNotifications}
        />
      )}
    </header>
  );
};
export default ScreenHeaderWithBack;
