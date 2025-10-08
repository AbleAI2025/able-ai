import styles from "../BuyerProfilePage.module.css";
import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import { BadgeIcon } from "@/app/components/profile/GetBadgeIcon";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface BadgesSectionProps {
  dashboardData: DashboardData;
}

export default function BadgesSection({ dashboardData }: BadgesSectionProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Badges Awarded</h2>
      <div className={styles.badges}>
        {dashboardData && dashboardData.badges.length > 0 ? (
          dashboardData?.badges?.map((badge) => (
            <div className={styles.badge} key={badge.id}>
              <AwardDisplayBadge
                icon={badge.icon as BadgeIcon}
                title={badge.name}
                role="buyer"
                type={badge.type}
              />
            </div>
          ))
        ) : (
          <p className={styles.noBadges}>No badges available</p>
        )}
      </div>
    </section>
  );
}