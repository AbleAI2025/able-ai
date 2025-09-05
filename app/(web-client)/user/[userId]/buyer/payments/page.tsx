/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Using Lucide Icons
import { Home, Filter, FileText, Repeat, ArrowLeft, Loader2, Wine, Utensils, Briefcase, ClipboardList } from 'lucide-react';
// Import Recharts components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

import styles from './PaymentsPage.module.css';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';
import { BuyerPayment, getBuyerPayments } from '@/actions/payments/get-buyer-payments';

// Define interfaces for payment data
interface Payment {
  id: string;
  // gigType: 'Bartender' | 'Waiter' | 'Chef' | 'Event Staff' | string; // Allow other types
  workerName: string;
  date: string; // ISO date string
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed'; // Example statuses
  invoiceUrl?: string;
  gigId?: string; // To link to gig for rehire
}

interface FilterState {
  staffType: 'All' | string;
  dateFrom?: string;
  dateTo?: string;
  priceFrom?: string;
  priceTo?: string;
}

// Mock function to fetch payments - replace with actual API call
async function fetchBuyerPayments(userId: string, filters: FilterState): Promise<BuyerPayment[]> {
  console.log("Fetching payments for buyerId:", userId, "with filter:", filters);

  const { data: allPayments } = await getBuyerPayments(userId, filters);

  if (!allPayments) return [];

  return allPayments;
}

// Mock chart data (aggregate by month for example)
const getChartData = (payments: BuyerPayment[]) => {
  const monthlyTotals: { [key: string]: number } = {};
  payments.forEach(p => {
    if (p.status === 'PAID' && p.date) {
      const month = new Date(p.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(p.amount);
    }
  });
  return Object.entries(monthlyTotals).map(([name, total]) => ({ name, total })).reverse(); // Newest first
};

export default function BuyerPaymentsPage() {
  const router = useRouter();
  const params = useParams();
  const pageUserId = params.userId as string;

  const { user, loading: isLoading } = useAuth();
  const authUserId = user?.uid;

  const [payments, setPayments] = useState<BuyerPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    staffType: 'All',
    dateFrom: '',
    dateTo: '',
    priceFrom: '',
    priceTo: '',
  })
  const [showFilterModal, setShowFilterModal] = useState(false); // For a potential filter modal

  // Available gig types for filtering (could be fetched or predefined)
  const gigTypes = ['All', 'Bartender', 'Waiter', 'Chef', 'Event Staff'];

  const retrieveBuyerPayments = async () => {
    setIsLoadingPayments(true);
    fetchBuyerPayments(authUserId || "", filters)
      .then(data => {
        setPayments(data);
        setError(null);
      })
      .catch(err => {
        console.error("Failed to fetch payments:", err);
        setError("Could not load payment history. Please try again.");
      })
      .finally(() => setIsLoadingPayments(false));
  }

  // Auth check and data load
  useEffect(() => {
    retrieveBuyerPayments();
  }, [isLoading, user, authUserId, pageUserId]);

  const handleGenerateInvoice = (paymentId: string) => {
    console.log("Generate invoice for payment ID:", paymentId);
    // TODO: API call to backend to generate and return invoice PDF (or link)
    // e.g., window.open(`/api/payments/${paymentId}/invoice`, '_blank');
    alert(`Invoice generation for ${paymentId} would be triggered here.`);
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [field]: value
    }));
  };

  const submitFilters = async () => {
    await retrieveBuyerPayments();
  };

  const handleRepeatGig = (gigId?: string) => {
    if (!gigId) {
      alert("Gig ID not available for rehire.");
      return;
    }
    console.log("Repeat gig ID:", gigId);
    router.push(`gigs/${gigId}/rehire`);
  };

  const chartData = useMemo(() => getChartData(payments), [payments]);

  const getGigIcon = (gigType: string) => {
    if (gigType === 'Bartender') return <Wine size={18} className={styles.paymentGigIcon} />;
    if (gigType === 'Waiter') return <Utensils size={18} className={styles.paymentGigIcon} />;
    if (gigType === 'Chef') return <Utensils size={18} className={styles.paymentGigIcon} /> // Could use a chef hat icon
    return <Briefcase size={18} className={styles.paymentGigIcon} />; // Default
  }


  if (isLoading || (!user && !isLoading) || (authUserId && authUserId !== pageUserId)) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton}>
            <ArrowLeft size={16} />
          </button>
          <h1 className={styles.pageTitle}>Payments</h1>
          <button onClick={() => setShowFilterModal(true)} className={styles.filterButton}>
            <Filter size={16} /> Filter
          </button>
        </header>
        <p className={styles.totalsNote}>Totals include Able AI & payment provider fees.</p>
        {/* Example of how a filter modal might be structured */}
        {showFilterModal && (
          <div className={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalHeader}>Filter Payments</h3>

              <div className={styles.modalFilterForm}>
                <div>
                  <p className={styles.modalHeader}>Gig Type</p>
                  <div className={styles.filterOptions} style={{ flexDirection: 'column' }}>
                    {gigTypes.map(type => (
                      <label key={type} className={styles.filterOptionLabel} style={{ padding: '0.5rem 0' }}>
                        <input
                          type="radio"
                          name="gigTypeModalFilter"
                          value={type}
                          checked={filters.staffType === type}
                          onChange={() => handleFilterChange('staffType', type)}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className={styles.modalHeader}>Date</p>
                  <div className={styles.filterOptions} style={{ flexDirection: 'column' }}>
                    <div className={styles.filterItem}>
                      <label htmlFor="dateFrom">
                        From
                      </label>
                      <input
                        id="dateFrom"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                      />
                    </div>
                    <div className={styles.filterItem}>
                      <label htmlFor="dateTo">
                        To
                      </label>
                      <input
                        id="dateTo"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className={styles.modalHeader}>Price</p>
                  <div className={styles.filterOptions} style={{ flexDirection: 'column' }}>
                    <div className={styles.filterItem}>
                      <label htmlFor="priceFrom">
                        Minimum price
                      </label>
                      <input
                        id="priceFrom"
                        type="number"
                        placeholder="0.00"
                        value={filters.priceFrom}
                        onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className={styles.filterItem}>
                      <label htmlFor="priceTo">
                        Maximum price
                      </label>
                      <input
                        id="priceTo"
                        type="number"
                        placeholder="1000.00"
                        value={filters.priceTo}
                        onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalActions}>
                <button onClick={() => setShowFilterModal(false)} className={`${styles.actionButton} ${styles.secondary}`}>Close</button>
                <button onClick={submitFilters} className={`${styles.actionButton} ${styles.secondary}`}>Apply filters</button>
              </div>
            </div>
          </div>
        )}


        {isLoadingPayments ? (
          <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={28} /> Loading payments...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>No payment history found {filters.staffType !== 'All' ? `for ${filters.staffType}s` : ''}.</div>
        ) : (
          <div className={styles.paymentList}>
            {payments.map(payment => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentCard}>
                  <div className={styles.paymentDetails}>
                    {getGigIcon(payment.gigType || '')}
                    <div className={styles.paymentHeader}>
                      <span className={styles.paymentGigInfo}>{payment.gigType}, {payment.workerName}</span>
                      {
                        payment.date ?
                          <span className={styles.paymentDate}>{new Date(payment.date || '').toLocaleDateString()}</span> :
                          <>Has not been paid yet</>
                      }
                    </div>
                  </div>

                  {payment.status === 'PAID' && (
                    <Link
                      href={payment.invoiceUrl || '/'}
                      className={styles.generateInvoice}
                    >
                      <FileText size={20} /> Invoice
                    </Link>
                  )}
                </div>


                <div className={styles.paymentRight}>
                  <span className={styles.amount}>£{(Number(payment.amount)).toFixed(2)}</span>
                  <div className={styles.actions}>
                    <button onClick={() => handleRepeatGig(payment.gigId || '')} className={styles.actionButton}>
                      Repeat Gig
                    </button>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bar Chart Visualization */}
        {/* <div className={styles.barChartContainer}>
          {isLoadingPayments ? (
            <div className={styles.loadingContainer}>
              <Loader2 className="animate-spin" size={28}/> Loading chart data...
            </div>
          ) : payments.length > 0 && chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={chartData} 
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#3a3a3a" 
                  vertical={false}
                />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#a0a0a0', fontSize: 12 }}
                  axisLine={{ stroke: '#3a3a3a' }}
                  tickLine={{ stroke: '#3a3a3a' }}
                />
                <YAxis 
                  tickFormatter={(value) => `£${value}`}
                  tick={{ fill: '#a0a0a0', fontSize: 12 }}
                  axisLine={{ stroke: '#3a3a3a' }}
                  tickLine={{ stroke: '#3a3a3a' }}
                />
                <Bar 
                  dataKey="total" 
                  fill="var(--primary-color)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : !isLoadingPayments ? (
            <div className={styles.emptyState}>No data available for chart.</div>
          ) : null}
        </div> */}
      </div>
    </div>
  );
}
