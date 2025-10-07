"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import MinimalFooterNav from '@/app/components/layout/MinimalFooterNav';

import styles from './DelegateGigPage.module.css';
import { Loader2 } from 'lucide-react';
import SearchSection from './components/SearchSection';
import AdvancedFilters from './components/AdvancedFilters';
import ResultsSummary from './components/ResultsSummary';
import WorkerList from './components/WorkerList';
import { useDelegateGig } from './useDelegateGig';



export default function DelegateGigPage() {
  const params = useParams();
  const gigId = params.gigId as string;

  const {
    filters,
    workers,
    isLoading,
    error,
    delegatingWorkerId,
    showFilters,
    setShowFilters,
    handleDelegate,
    updateFilter,
    clearFilters
  } = useDelegateGig(gigId);

  return (
    <div className={styles.pageContainer}>
      <ScreenHeaderWithBack title="Delegate Gig" />

      <div className={styles.contentArea}>
        <SearchSection
          filters={filters}
          updateFilter={updateFilter}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />

        {showFilters && (
          <AdvancedFilters
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
          />
        )}

        {!isLoading && workers.length > 0 && (
          <ResultsSummary workers={workers} />
        )}

        {isLoading && (
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className="animate-spin" />
            <p>Loading workers...</p>
          </div>
        )}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {!isLoading && !error && workers.length === 0 && (
          <p className={styles.emptyMessage}>
            No workers found matching your search criteria.
            {filters.searchTerm && " Try adjusting your search terms or filters."}
          </p>
        )}

        {!isLoading && workers.length > 0 && (
          <WorkerList
            workers={workers}
            onDelegate={handleDelegate}
            delegatingWorkerId={delegatingWorkerId}
          />
        )}
      </div>

      <MinimalFooterNav />
    </div>
  );
} 