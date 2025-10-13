import styles from "../BuyerProfilePage.module.css";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface CompletedHiresProps {
  dashboardData: DashboardData;
}

export default function CompletedHires({ dashboardData }: CompletedHiresProps) {
  return (
    <div className={styles.completedHiresCard}>
      <div className={styles.completedHiresCount}>
        <span className={styles.completedHiresLabel}>Completed Hires</span>
        <span className={styles.completedHiresNumber}>
          {dashboardData.completedHires}
        </span>
      </div>
      <div className={styles.staffTypesList}>
        <span className={styles.completedHiresLabel}>
          Types of Staff Hired:
        </span>
        {dashboardData?.topSkills && dashboardData.topSkills.length > 0 ? (
          <ul>
            {dashboardData.topSkills.map((type, index) => (
              <li key={`buyer-gig-skills-types-${index}-${type.name}`}>{type.name}</li>
            ))}
          </ul>
        ) : (
          <span className={styles.emptyMessage}>No staff types yet</span>
        )}
      </div>
    </div>
  );
}