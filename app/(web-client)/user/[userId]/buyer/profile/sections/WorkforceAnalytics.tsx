import styles from "../BuyerProfilePage.module.css";
import PieChartComponent from "@/app/components/shared/PiChart";
import BarChartComponent from "@/app/components/shared/BarChart";
import { hasSignificantPayments } from "@/utils/payment-utils";
import DashboardData from "@/app/types/BuyerProfileTypes";

interface WorkforceAnalyticsProps {
  dashboardData: DashboardData;
}

export default function WorkforceAnalytics({ dashboardData }: WorkforceAnalyticsProps) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Workforce Analytics</h2>
      <div className={styles.analyticsChartsContainer}>
        {dashboardData?.skills && dashboardData.skills.length > 0 ? (
          <PieChartComponent skills={dashboardData?.skills} />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 50,
              background: '#333',
              borderRadius: 8,
              color: '#fff',
              fontSize: 16
            }}
          >
            No skills data available
          </div>
        )}
        {hasSignificantPayments(dashboardData?.totalPayments || []) ? (
          <BarChartComponent
            data={(dashboardData?.totalPayments || []).map(p => ({ name: p.name, total: p.amount }))}
            emptyMessage="You don't have payments yet"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 50,
              background: '#333',
              borderRadius: 8,
              color: '#fff',
              fontSize: 16
            }}
          >
            You don&apos;t have payments yet
          </div>
        )}
      </div>
    </section>
  );
}