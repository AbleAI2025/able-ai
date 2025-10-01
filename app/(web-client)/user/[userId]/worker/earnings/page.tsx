"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

// Using Lucide Icons
import { Filter, ArrowLeft, Loader2, Briefcase, Wine, Utensils } from 'lucide-react';
import styles from './EarningsPage.module.css';
import { useAuth } from '@/context/AuthContext';
import { getLastRoleUsed } from '@/lib/last-role-used';
import BarChartComponent from '@/app/components/shared/BarChart';
import { getWorkerEarnings, WorkerEarning } from '@/actions/earnings/get-worker-earnings';

interface FilterState {
  staffType: 'All' | string;
  dateFrom?: string;
  dateTo?: string;
  priceFrom?: string;
  priceTo?: string;
}

async function fetchWorkerEarnings(userId: string, filters: FilterState): Promise<WorkerEarning[]> {
  console.log("Fetching payments for buyerId:", userId, "with filter:", filters);

  const { data: allEarnings } = await getWorkerEarnings(userId, filters);

  if (!allEarnings) return [];

  return allEarnings;
}

// Mock chart data (aggregate by month for example)
const getEarningsChartData = (earnings: WorkerEarning[]) => {
  const monthlyTotals: { [key: string]: number } = {};
  earnings.forEach(earn => {
    if (earn.status === 'PAID' && earn.paidAt) { // Only count cleared earnings for the chart
      const month = new Date(earn.paidAt).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(earn.totalEarnings);
    }
  });
  return Object.entries(monthlyTotals).map(([name, total]) => ({ name, total })).reverse();
};

// Custom tooltip component for the chart
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; stroke: string; fill: string; dataKey: string; payload: { name: string; total: number } }>;
  label?: string | number;
}
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.chartTooltip}>
        <p className={styles.tooltipLabel}>{label}</p>
        <p className={styles.tooltipValue}>£{payload[0].value.toFixed(2)}</p>
      </div>
    );
  }
  return null;
};

export default function WorkerEarningsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;
  const lastRoleUsed = getLastRoleUsed();
  const { user, loading: loadingAuth } = useAuth();
  const [earnings, setEarnings] = useState<WorkerEarning[]>([]);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const authUserId = user?.uid;

  const [filters, setFilters] = useState<FilterState>({
    staffType: 'All',
    dateFrom: '',
    dateTo: '',
    priceFrom: '',
    priceTo: '',
  });
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Assuming gig types are similar to buyer's payment screen
  const gigTypes = ['All', 'Bartender', 'Waiter', 'Chef', 'Event Staff'];

  const retrieveWorkerEarnings = () => {
    // Ensure user is authenticated, authorized for this page, and has necessary roles before fetching
    if (!loadingAuth && user && authUserId === pageUserId) {
      setIsLoadingEarnings(true);
      fetchWorkerEarnings(pageUserId, filters) // Fetch earnings for the pageUserId
        .then(data => {
          setEarnings(data);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to fetch earnings:", err);
          setError('Failed to load earnings. Please try again.');
          setEarnings([]); // Clear earnings on error
        })
        .finally(() => setIsLoadingEarnings(false));
    } else if (!loadingAuth && user && authUserId === pageUserId && !(lastRoleUsed === "GIG_WORKER" || user?.claims.role === "QA")) {
      // If user is auth'd for page, but no role, don't attempt fetch, auth useEffect handles redirect
      // Set loading to false as fetch won't occur.
      setIsLoadingEarnings(false);
      setEarnings([]); // Ensure earnings are cleared if roles are missing
      setError("Access denied: You do not have the required role to view earnings."); // Optional: set an error message
    } else if (!loadingAuth && (!user || authUserId !== pageUserId)) {
      // If not authenticated or not authorized for this page, ensure loading is false and data is clear
      setIsLoadingEarnings(false);
      setEarnings([]);
      // Error message or redirect is handled by the primary auth useEffect
    }
  };

  // Fetch earnings
  useEffect(() => {
    retrieveWorkerEarnings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth, authUserId, pageUserId, filters]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [field]: value
    }));
  };

  const submitFilters = async () => {
    await retrieveWorkerEarnings();
  };

  const chartData = useMemo(() => getEarningsChartData(earnings), [earnings]);

  const getGigIcon = (gigType: string) => {
    if (gigType === 'Bartender') return <Wine size={18} className={styles.earningGigIcon} />;
    if (gigType === 'Waiter') return <Utensils size={18} className={styles.earningGigIcon} />;
    if (gigType === 'Chef') return <Utensils size={18} className={styles.earningGigIcon} />;
    return <Briefcase size={18} className={styles.earningGigIcon} />;
  }

  if (loadingAuth || !user) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeft size={16} />
          </button>
          <h1 className={styles.pageTitle}>Earnings</h1>
          <button onClick={() => setShowFilterModal(true)} className={styles.filterButton}>
            <Filter size={16} /> Filter
          </button>
        </header>

        {/* Filter Options - Simplified for this example, could be a modal */}

        {showFilterModal && (
          <div className={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalHeader}>Filter Earnings</h3>
              <div className={styles.filterOptions} style={{ flexDirection: 'column' }}>
                {gigTypes.map(type => (
                  <label key={type} className={styles.filterOptionLabel} style={{ padding: '0.5rem 0' }}>
                    <input
                      type="radio"
                      name="gigTypeModalEarningsFilter"
                      value={type}
                      checked={filters.staffType === type}
                      onChange={() => { handleFilterChange('staffType', type); setShowFilterModal(false); }}
                    />
                    {type}
                  </label>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button onClick={() => setShowFilterModal(false)} className={`${styles.actionButton} ${styles.secondary}`}>Close</button>
              </div>
            </div>
          </div>
        )}

        {isLoadingEarnings ? (
          <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={28} /> Loading earnings...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : earnings.length === 0 ? (
          <div className={styles.emptyState}>No earnings history found {filters.staffType !== 'All' ? `for ${filters.staffType}s` : ''}.</div>
        ) : (
          <div className={styles.earningsList}>
            {earnings.map(earning => (
              <div key={earning.id} className={styles.earningItem}>
                <div className={styles.earningDetails}>
                  {getGigIcon(earning.gigType || '')}
                  <div className={styles.earningHeader}>
                    <span className={styles.earningGigInfo}>{earning.gigType}</span>
                    {
                      earning.paidAt ?
                        <span className={styles.paymentDate}>{new Date(earning.paidAt).toLocaleDateString()}</span> :
                        <>Has not been paid yet</>
                    }
                  </div>
                </div>
                <span className={styles.amount}>£{Number(earning.totalEarnings).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className={styles.barChartContainer}>
          {!isLoadingEarnings &&
            <BarChartComponent data={chartData} emptyMessage="You don't have earnings yet" />
          }
        </div>
        {/* 
        <div className={styles.barChartContainer}>
          {isLoadingEarnings ? "Loading chart data..." : earnings.length > 0 && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
                <XAxis dataKey="name" tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `£${value}`} tick={{ fill: '#a0a0a0', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="var(--success-color)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : !isLoadingEarnings ? "No earnings data available for chart." : ""}
        </div> */}
      </div>
    </div>
  );
} 