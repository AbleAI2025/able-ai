"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Using Lucide Icons
import { Home, Filter, ArrowLeft, Loader2, Briefcase, Wine, Utensils, ExternalLink, ClipboardList } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import styles from './EarningsPage.module.css';
import { useAuth } from '@/context/AuthContext';
import { getLastRoleUsed } from '@/lib/last-role-used';
import Image from 'next/image';

// Define interface for earning data
interface Earning {
  id: string;
  gigType: string;
  gigTitle: string;
  buyerName: string;
  date: string;
  amount: number;
  status: 'Cleared' | 'Pending' | 'Processing';
  gigId: string;
}

// Mock function to fetch earnings - replace with actual API call
async function fetchWorkerEarnings(userId: string, filterType?: string): Promise<Earning[]> {
  console.log("Fetching earnings for workerId:", userId, "with filter:", filterType);
  // In a real app, fetch from: `/api/earnings/worker?userId=${userId}&type=${filterType}`
  await new Promise(resolve => setTimeout(resolve, 700));

  const allEarnings: Earning[] = [
    { id: 'e1', gigType: 'Bartender', gigTitle: 'Weekend Bar Shift', buyerName: 'The Grand Cafe', date: '2023-12-15T00:00:00Z', amount: 150.00, status: 'Cleared', gigId: 'gig101' },
    { id: 'e2', gigType: 'Waiter', gigTitle: 'Private Dinner Party', buyerName: 'Alice Wonderland', date: '2023-12-11T00:00:00Z', amount: 120.00, status: 'Cleared', gigId: 'gig102' },
    { id: 'e3', gigType: 'Bartender', gigTitle: 'Corporate Event Cocktails', buyerName: 'Innovate Corp', date: '2023-12-09T00:00:00Z', amount: 180.00, status: 'Pending', gigId: 'gig103' },
    { id: 'e4', gigType: 'Chef', gigTitle: 'Pop-up Kitchen Lead', buyerName: 'Foodie Fest', date: '2023-11-22T00:00:00Z', amount: 230.00, status: 'Cleared', gigId: 'gig104'},
  ];
  if (filterType && filterType !== "All") {
    return allEarnings.filter(e => e.gigType === filterType);
  }
  return allEarnings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Mock chart data (aggregate by month for example)
const getEarningsChartData = (earnings: Earning[]) => {
  const monthlyTotals: { [key: string]: number } = {};
  earnings.forEach(e => {
    if (e.status === 'Cleared') { // Only count cleared earnings for the chart
      const month = new Date(e.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + e.amount;
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
  const lastRoleUsed = getLastRoleUsed()
  
  
  const { user, loading: loadingAuth } = useAuth();
  const authUserId = user?.uid;

  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [isLoadingEarnings, setIsLoadingEarnings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterGigType, setFilterGigType] = useState<'All' | string>('All');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Assuming gig types are similar to buyer's payment screen
  const gigTypes = ['All', 'Bartender', 'Waiter', 'Chef', 'Event Staff'];

  // Fetch earnings
  useEffect(() => {
    // Ensure user is authenticated, authorized for this page, and has necessary roles before fetching
    if (!loadingAuth && user && authUserId === pageUserId && user?.claims.role === "QA") {
      setIsLoadingEarnings(true);
      fetchWorkerEarnings(pageUserId, filterGigType) // Fetch earnings for the pageUserId
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
    } else if (!loadingAuth && user && authUserId === pageUserId && !(lastRoleUsed === "GIG_WORKER" || user?.claims.role === "QA")){
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loadingAuth, authUserId, pageUserId, filterGigType]);
  
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
                    <div className={styles.filterOptions} style={{flexDirection: 'column'}}>
                        {gigTypes.map(type => (
                            <label key={type} className={styles.filterOptionLabel} style={{padding: '0.5rem 0'}}>
                            <input
                                type="radio"
                                name="gigTypeModalEarningsFilter"
                                value={type}
                                checked={filterGigType === type}
                                onChange={() => { setFilterGigType(type); setShowFilterModal(false);}}
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
          <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={28}/> Loading earnings...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : earnings.length === 0 ? (
          <div className={styles.emptyState}>No earnings history found {filterGigType !== 'All' ? `for ${filterGigType}s` : ''}.</div>
        ) : (
          <div className={styles.earningsList}>
            {earnings.map(earning => (
              <div key={earning.id} className={styles.earningItem}>
                <div className={styles.earningDetails}>
                  {getGigIcon(earning.gigType)}
                  <div className={styles.earningHeader}>
                    <span className={styles.earningGigInfo}>{earning.gigType}</span>
                    <span className={styles.earningDate}>{new Date(earning.date).toLocaleDateString()}</span>
                  </div>                  
                </div>
                <span className={styles.amount}>£{earning.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
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