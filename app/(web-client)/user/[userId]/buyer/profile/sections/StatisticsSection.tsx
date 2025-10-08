import { ThumbsUp, MessageSquare } from "lucide-react";
import styles from "../BuyerProfilePage.module.css";
import StatisticItemDisplay from "@/app/components/profile/StatisticItemDisplay";
import DashboardData from "@/app/types/BuyerProfileTypes";
import { User } from "@/context/AuthContext";

interface StatisticsSectionProps {
  dashboardData: DashboardData;
  user: User;
}

export default function StatisticsSection({ dashboardData, user }: StatisticsSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Statistics</h2>
      <div className={styles.statisticsItemsContainer}>
        <StatisticItemDisplay
          stat={{
            id: 1,
            icon: ThumbsUp,
            value: dashboardData?.responseRateInternal || 0,
            label: `Would work with ${user?.displayName?.split(" ")?.[0] ?? ""
              } again`,
            iconColor: "#7eeef9",
          }}
        />
        <StatisticItemDisplay
          stat={{
            id: 2,
            icon: MessageSquare,
            value: dashboardData?.averageRating || 0,
            label: "Response rate",
            iconColor: "#7eeef9",
          }}
        />
      </div>
    </section>
  );
}