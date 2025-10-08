"use client";

import { ThumbsUp, MessageSquare } from "lucide-react";
import StatisticItemDisplay from "./StatisticItemDisplay";
import styles from "./WorkerProfile.module.css";
import PublicWorkerProfile from "@/app/types/workerProfileTypes";

interface StatisticsSectionProps {
  workerProfile: PublicWorkerProfile;
}

export default function StatisticsSection({ workerProfile }: StatisticsSectionProps) {
  return (
    <div>
      <h3 className={styles.contentTitle}>Statistics</h3>
      <div className={styles.statisticsItemsContainer}>
        <StatisticItemDisplay
          stat={{
            id: 1,
            icon: ThumbsUp,
            value: workerProfile?.responseRateInternal || 0,
            label: `Would work with ${
              workerProfile?.user?.fullName?.split(" ")?.[0] ?? ""
            } again`,
            iconColor: "#41a1e8",
          }}
        />

        <StatisticItemDisplay
          stat={{
            id: 2,
            icon: MessageSquare,
            value: workerProfile?.averageRating || 0,
            label: "Response rate",
            iconColor: "#41a1e8",
          }}
        />
      </div>
    </div>
  );
}