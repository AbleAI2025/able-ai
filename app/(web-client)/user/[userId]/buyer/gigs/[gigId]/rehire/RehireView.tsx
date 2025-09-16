import React from "react";
import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import RehireWorkerCard from "@/app/components/buyer/RehireWorkerCard";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import styles from "./RehirePage.module.css";
import type { OriginalGigInfo, RehireWorkerData } from "./RehireContainer";
import Image from "next/image";

const BOT_AVATAR_SRC = "/images/logo-placeholder.svg";

type ChatMessage = {
  id: number;
  type: "bot" | "userAction";
  content: string | React.ReactNode;
};

interface RehireViewProps {
  loadingAuth: boolean;
  error: string | null;
  originalGigInfo?: OriginalGigInfo | null;
  workerToRehire?: RehireWorkerData | null;
  chatMessages: ChatMessage[];
  chatContainerRef: React.RefObject<HTMLDivElement>;
  handleBookWorker: () => void;
  isBooking: boolean;
  userId: string;
}

const RehireView: React.FC<RehireViewProps> = ({
  loadingAuth,
  error,
  originalGigInfo,
  workerToRehire,
  chatMessages,
  chatContainerRef,
  handleBookWorker,
  isBooking,
  userId,
}) => {
  if (loadingAuth) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="animate-spin" size={32} /> Loading Rehire Information...
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.errorMessage}>{error}</p>
        </div>
      </div>
    );
  }
  if (!originalGigInfo || !workerToRehire) {
    return (
      <div className={styles.container}>
        <div className={styles.pageWrapper}>
          <p className={styles.emptyState}>Information for rehire not available.</p>
        </div>
      </div>
    );
  }
  return (
    <div className={styles.container}>
      <ChatBotLayout ref={chatContainerRef}>
        {chatMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.content as string}
            senderType={msg.type === "bot" ? "bot" : "user"}
            avatarSrc={BOT_AVATAR_SRC}
            showAvatar={msg.type === "bot"}
          />
        ))}
        {workerToRehire && (
          <div className={styles.rehireCardContainer}>
            <RehireWorkerCard
              workerData={workerToRehire}
              onBook={handleBookWorker}
              isBooking={isBooking}
            />
          </div>
        )}
        {error && !isBooking && (
          <MessageBubble
            text={`Oops! ${error}`}
            senderType="bot"
            avatarSrc={BOT_AVATAR_SRC}
          />
        )}
      </ChatBotLayout>
      <footer className={styles.footerNav}>
        <Link href={`/user/${userId}/buyer`} passHref>
          <button className={styles.homeButtonNav} aria-label="Go to Home">
            <Image src="/images/home.svg" width={40} height={40} alt="home" />
          </button>
        </Link>
      </footer>
    </div>
  );
};

export default RehireView; 