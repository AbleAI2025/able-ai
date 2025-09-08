"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ScreenHeaderWithBack from '@/app/components/layout/ScreenHeaderWithBack';
import SearchInput from '@/app/components/forms/SearchInput';
import WorkerDelegateItemCard from '@/app/components/gigs/WorkerDelegateItemCard';
import MinimalFooterNav from '@/app/components/layout/MinimalFooterNav';
import { toast } from 'sonner';

import styles from './DelegateGigPage.module.css';
import { Loader2 } from 'lucide-react';

interface Worker {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  primarySkill: string;
  experienceYears: number;
  hourlyRate: number;
  bio: string;
  location: string;
}

// Real API functions
async function fetchPotentialDelegates(gigId: string, searchTerm: string, token: string): Promise<Worker[]> {
  try {
    const response = await fetch(`/api/gigs/${gigId}/potential-delegates?search=${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch workers');
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error fetching potential delegates:', error);
    throw error;
  }
}

async function delegateGigToWorkerAPI(gigId: string, workerId: string, token: string): Promise<{success: boolean, message?: string}> {
  try {
    const response = await fetch(`/api/gigs/${gigId}/delegate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newWorkerId: workerId,
        reason: 'Gig delegation request'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delegate gig');
    }

    const data = await response.json();
    return { success: true, message: data.message };
  } catch (error) {
    console.error('Error delegating gig:', error);
    throw error;
  }
}


export default function DelegateGigPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const gigId = params.gigId as string;

  const [searchTerm, setSearchTerm] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegatingWorkerId, setDelegatingWorkerId] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkers = async () => {
      if (!user?.token) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const fetchedWorkers = await fetchPotentialDelegates(gigId, searchTerm, user.token);
        setWorkers(fetchedWorkers);
      } catch (err: any) {
        setError(err.message || "Failed to load workers. Please try again.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Debounce search or load on initial mount
    const debounceTimeout = setTimeout(() => {
        loadWorkers();
    }, searchTerm ? 300 : 0);

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, gigId, user?.token]);

  const handleDelegate = async (workerId: string) => {
    if (!gigId || !user?.token) {
        toast.error("Missing required information.");
        return;
    }
    
    setDelegatingWorkerId(workerId);
    setError(null);
    
    try {
        const result = await delegateGigToWorkerAPI(gigId, workerId, user.token);
        if (result.success) {
            toast.success(result.message || "Gig successfully delegated!");
            // Navigate back to gig details or dashboard
            router.push(`/gigs/${gigId}`);
        } else {
            throw new Error("Failed to delegate gig.");
        }
    } catch (err: any) {
        const errorMessage = err.message || "An error occurred while delegating.";
        setError(errorMessage);
        toast.error(errorMessage);
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