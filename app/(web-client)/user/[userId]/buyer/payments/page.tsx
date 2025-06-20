"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// Using Lucide Icons
import { Home, Filter, FileText, Repeat, ArrowLeft, Loader2, Wine, Utensils, Briefcase } from 'lucide-react';
// Import Recharts components
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';

import styles from './PaymentsPage.module.css';
import { useAuth } from '@/context/AuthContext';

// Define interfaces for payment data
interface Payment {
  id: string;
  gigType: 'Bartender' | 'Waiter' | 'Chef' | 'Event Staff' | string; // Allow other types
  workerName: string;
  date: string; // ISO date string
  amount: number;
  status: 'Paid' | 'Pending' | 'Failed'; // Example statuses
  invoiceUrl?: string;
  gigId?: string; // To link to gig for rehire
}

// Mock function to fetch payments - replace with actual API call
async function fetchBuyerPayments(userId: string, filterType?: string): Promise<Payment[]> {
  console.log("Fetching payments for buyerId:", userId, "with filter:", filterType);
  // In a real app, fetch from: `/api/payments/buyer?userId=${userId}&type=${filterType}`
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate delay

  const allPayments: Payment[] = [
    { id: '1', gigType: 'Bartender', workerName: 'Jerimaiah Jones', date: '2023-12-12T10:00:00Z', amount: 165.00, status: 'Paid', invoiceUrl: 'invoices/inv-001.pdf', gigId: 'gig1' },
    { id: '2', gigType: 'Waiter', workerName: 'Gavin Trysdale, B. Button', date: '2023-12-10T14:30:00Z', amount: 420.00, status: 'Paid', gigId: 'gig2' },
    { id: '3', gigType: 'Bartender', workerName: 'Megan House', date: '2023-12-08T18:00:00Z', amount: 180.00, status: 'Pending', gigId: 'gig3' },
    { id: '4', gigType: 'Chef', workerName: 'Gordon Ramsay Jr.', date: '2023-11-20T12:00:00Z', amount: 250.00, status: 'Paid', invoiceUrl: 'invoices/inv-004.pdf', gigId: 'gig4'},
    { id: '5', gigType: 'Bartender', workerName: 'Jerimaiah Jones', date: '2023-11-05T19:00:00Z', amount: 150.00, status: 'Paid', gigId: 'gig5' },
  ];
  if (filterType && filterType !== "All") {
    return allPayments.filter(p => p.gigType === filterType);
  }
  return allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Mock chart data (aggregate by month for example)
const getChartData = (payments: Payment[]) => {
  const monthlyTotals: { [key: string]: number } = {};
  payments.forEach(p => {
    if (p.status === 'Paid') {
      const month = new Date(p.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyTotals[month] = (monthlyTotals[month] || 0) + p.amount;
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

  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filterGigType, setFilterGigType] = useState<'All' | string>('All');
  const [showFilterModal, setShowFilterModal] = useState(false); // For a potential filter modal

  // Available gig types for filtering (could be fetched or predefined)
  const gigTypes = ['All', 'Bartender', 'Waiter', 'Chef', 'Event Staff'];


  // Auth check and data load
  useEffect(() => {

      setIsLoadingPayments(true);
      fetchBuyerPayments(authUserId || "", filterGigType)
        .then(data => {
          setPayments(data);
          setError(null);
        })
        .catch(err => {
          console.error("Failed to fetch payments:", err);
          setError("Could not load payment history. Please try again.");
        })
        .finally(() => setIsLoadingPayments(false));
  }, [isLoading, user, authUserId, pageUserId, filterGigType, router]);

  const handleGenerateInvoice = (paymentId: string) => {
    console.log("Generate invoice for payment ID:", paymentId);
    // TODO: API call to backend to generate and return invoice PDF (or link)
    // e.g., window.open(`/api/payments/${paymentId}/invoice`, '_blank');
    alert(`Invoice generation for ${paymentId} would be triggered here.`);
  };

  const handleRepeatGig = (gigId?: string) => {
    if (!gigId) {
        alert("Gig ID not available for rehire.");
        return;
    }
    console.log("Repeat gig ID:", gigId);
    // TODO: Navigate to a pre-filled hire/booking page for this gig/worker
    // router.push(`/buyer/hire?repeatGigId=${gigId}`);
    alert(`Rehiring for gig ${gigId} would be initiated here.`);
  };
  
  const chartData = useMemo(() => getChartData(payments), [payments]);

  const getGigIcon = (gigType: string) => {
    if (gigType === 'Bartender') return <Wine size={18} className={styles.paymentGigIcon} />;
    if (gigType === 'Waiter') return <Utensils size={18} className={styles.paymentGigIcon} />;
    if (gigType === 'Chef') return <Utensils size={18} className={styles.paymentGigIcon} /> // Could use a chef hat icon
    return <Briefcase size={18} className={styles.paymentGigIcon} />; // Default
  }


  if (isLoading || (!user && !isLoading) || (authUserId && authUserId !== pageUserId) ) {
    return <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={32} /> Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.pageWrapper}>
        <header className={styles.header}>
          <button onClick={() => router.back()} className={styles.backButton} aria-label="Go back">
            <ArrowLeft size={24} />
          </button>
          <h1 className={styles.pageTitle}>Payments</h1>
          <button onClick={() => setShowFilterModal(true)} className={styles.filterButton}>
            <Filter size={16} /> Filter
          </button>
        </header>

        {/* Filter Options (could be in a modal triggered by the Filter button) */}
        {/* For simplicity, showing inline filters here. Modal is a UX choice. */}
        {!showFilterModal && ( // Simple inline toggle for now
            <section className={styles.filterSection}>
                <div className={styles.filterSectionTitle}>Filter by Gig Type:</div>
                <div className={styles.filterOptions}>
                {gigTypes.map(type => (
                    <label key={type} className={styles.filterOptionLabel}>
                    <input
                        type="radio"
                        name="gigTypeFilter"
                        value={type}
                        checked={filterGigType === type}
                        onChange={() => setFilterGigType(type)}
                    />
                    {type}
                    </label>
                ))}
                </div>
                <p className={styles.filterNote}>Totals include Able AI & payment provider fees.</p>
            </section>
        )}
        
        {/* Example of how a filter modal might be structured */}
        {showFilterModal && (
            <div className={styles.modalOverlay} onClick={() => setShowFilterModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                    <h3 className={styles.modalHeader}>Filter Payments</h3>
                    <div className={styles.filterOptions} style={{flexDirection: 'column'}}>
                        {gigTypes.map(type => (
                            <label key={type} className={styles.filterOptionLabel} style={{padding: '0.5rem 0'}}>
                            <input
                                type="radio"
                                name="gigTypeModalFilter"
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


        {isLoadingPayments ? (
          <div className={styles.loadingContainer}><Loader2 className="animate-spin" size={28}/> Loading payments...</div>
        ) : error ? (
          <div className={styles.emptyState}>{error}</div>
        ) : payments.length === 0 ? (
          <div className={styles.emptyState}>No payment history found {filterGigType !== 'All' ? `for ${filterGigType}s` : ''}.</div>
        ) : (
          <div className={styles.paymentList}>
            {payments.map(payment => (
              <div key={payment.id} className={styles.paymentItem}>
                <div className={styles.paymentHeader}>
                  {getGigIcon(payment.gigType)}
                  <span className={styles.paymentGigInfo}>{payment.gigType}</span>
                  <span className={styles.paymentDate}>- {new Date(payment.date).toLocaleDateString()}</span>
                </div>
                <p className={styles.paymentWorkerName}>With: {payment.workerName}</p>
                
                <div className={styles.paymentFooter}>
                  <span className={styles.amount}>{payment.amount.toFixed(2)}</span>
                  <div className={styles.actions}>
                    {payment.status === 'Paid' && (
                      <Link 
                        href={`/user/${params.userId}/buyer/payments/invoice?id=${payment.id}`}
                        className={styles.actionButton}
                      >
                        <FileText size={14} /> View Invoice
                      </Link>
                    )}
                    {payment.status === 'Paid' && !payment.invoiceUrl && (
                       <button onClick={() => handleGenerateInvoice(payment.id)} className={styles.actionButton}>
                         <FileText size={14} /> Generate Invoice
                       </button>
                    )}
                     {payment.status === 'Pending' && (
                       <button onClick={() => alert(`Payment for ${payment.id} would be initiated here.`)} className={`${styles.actionButton} ${styles.primaryAction}`}>
                         Pay Now
                       </button>
                    )}
                    {payment.gigId && (
                        <button onClick={() => handleRepeatGig(payment.gigId)} className={styles.actionButton}>
                            <Repeat size={14} /> Repeat Gig
                        </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bar Chart Visualization */}
        <div className={styles.barChartContainer}>
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
        </div>

        <footer className={styles.footer}>
          <Link href={`/user/${pageUserId}/buyer`} passHref>
            <button className={styles.homeButton} aria-label="Go to Home">
                <Home size={24} />
            </button>
          </Link>
        </footer>
      </div>
    </div>
  );
} 