"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// Assuming sub-components are created and imported
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import SearchInput from '@/app/components/forms/SearchInput';
import WorkerDelegateItemCard from '@/app/components/gigs/WorkerDelegateItemCard';
import MinimalFooterNav from '@/app/components/layout/MinimalFooterNav';

import styles from './DelegateGigPage.module.css';
import { Loader2 } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
}

// Mock API functions
async function fetchPotentialDelegates(searchTerm: string): Promise<Worker[]> {
  console.log("Fetching delegates for term:", searchTerm);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  const allWorkers: Worker[] = [
    { id: '1', name: 'Alex Johnson', username: 'alexjohnson', avatarUrl: '/images/avatar-alex.jpg' },
    { id: '2', name: 'Jamie Lee', username: 'jamielee', avatarUrl: '/images/avatar-jamie.jpg' },
    { id: '3', name: 'Samantha Brown', username: 'samanthabrown', avatarUrl: '/images/avatar-samantha.jpg' },
    { id: '4', name: 'Chris Davis', username: 'chrisdavis', avatarUrl: '/images/avatar-chris.jpg' },
    { id: '5', name: 'Patricia Miller', username: 'patriciamiller', avatarUrl: '/images/avatar-patricia.jpg' },
  ];
  if (!searchTerm.trim()) return allWorkers.slice(0, 3); // Show initial few if no search
  return allWorkers.filter(
    w => w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         w.username.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

async function delegateGigToWorkerAPI(gigId: string, workerId: string): Promise<{success: boolean}> {
    console.log(`API: Delegating gig ${gigId} to worker ${workerId}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    // For demo, always succeed after a delay
    // if (Math.random() > 0.8) return { success: false }; // Simulate occasional failure
    return { success: true };
}


export default function DelegateGigPage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params.gigId as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegatingWorkerId, setDelegatingWorkerId] = useState<string | null>(null); // To show loading on specific button

  useEffect(() => {
    const loadWorkers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedWorkers = await fetchPotentialDelegates(searchTerm);
        setWorkers(fetchedWorkers);
      } catch (err) {
        setError("Failed to load workers. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search or load on initial mount
    const debounceTimeout = setTimeout(() => {
        loadWorkers();
    }, searchTerm ? 300 : 0); // Instant load for initial, debounce for search

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm]);

  const handleDelegate = async (workerId: string) => {
    if (!gigId) {
        alert("Gig ID is missing.");
        return;
    }
    setDelegatingWorkerId(workerId);
    setError(null);
    try {
        const result = await delegateGigToWorkerAPI(gigId, workerId);
        if (result.success) {
            alert(`Gig successfully delegated to worker ${workerId}!`);
            // Potentially navigate away or show success message
            router.push('/dashboard'); // Example redirect
        } else {
            throw new Error("Failed to delegate gig.");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "An error occurred while delegating.");
          alert(err.message || "An error occurred while delegating.");
        } else {
          setError("An unknown error occurred.");
          alert("An unknown error occurred.");
        }
    } finally {
        setDelegatingWorkerId(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <ScreenHeaderWithBack title="Delegate Gig" onBackClick={() => router.back()} />
      
      <div className={styles.contentArea}>
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by gig worker username"
          className={styles.searchInputArea}
        />

        {isLoading && (
          <div className={styles.loadingContainer}>
            <Loader2 size={32} className="animate-spin" /> 
            <p>Loading workers...</p>
          </div>
        )}
        {error && <p className={styles.errorMessage}>{error}</p>}
        
        {!isLoading && !error && workers.length === 0 && (
          <p className={styles.emptyMessage}>No workers found matching your search.</p>
        )}

        {!isLoading && workers.length > 0 && (
          <div className={styles.workerList}>
            {workers.map(worker => (
              <WorkerDelegateItemCard
                key={worker.id}
                worker={worker}
                onDelegate={handleDelegate}
                isDelegating={delegatingWorkerId === worker.id}
              />
            ))}
          </div>
        )}
      </div>
      
      <MinimalFooterNav />
    </div>
  );
} 