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
  distance: number;
  skillMatchScore: number;
  availabilityScore: number;
  overallScore: number;
  skills: Array<{
    name: string;
    experienceYears: number;
    agreedRate: number;
  }>;
  isAvailable: boolean;
  lastActive?: string;
}

interface SearchFilters {
  searchTerm: string;
  minExperience?: number;
  maxRate?: number;
  minRate?: number;
  skills: string[];
  availableOnly: boolean;
  sortBy: 'relevance' | 'distance' | 'experience' | 'rate';
}

// Enhanced API functions with filters
async function fetchPotentialDelegates(gigId: string, filters: SearchFilters, token: string): Promise<Worker[]> {
  try {
    const params = new URLSearchParams();
    
    if (filters.searchTerm) params.append('search', filters.searchTerm);
    if (filters.minExperience) params.append('minExperience', filters.minExperience.toString());
    if (filters.maxRate) params.append('maxRate', filters.maxRate.toString());
    if (filters.minRate) params.append('minRate', filters.minRate.toString());
    if (filters.skills.length > 0) params.append('skills', filters.skills.join(','));
    if (filters.availableOnly) params.append('availableOnly', 'true');
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const response = await fetch(`/api/gigs/${gigId}/potential-delegates?${params.toString()}`, {
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

  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: '',
    minExperience: undefined,
    maxRate: undefined,
    minRate: undefined,
    skills: [],
    availableOnly: false,
    sortBy: 'relevance'
  });
  
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegatingWorkerId, setDelegatingWorkerId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadWorkers = async () => {
      if (!user?.token) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const fetchedWorkers = await fetchPotentialDelegates(gigId, filters, user.token);
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
    }, filters.searchTerm ? 300 : 0);

    return () => clearTimeout(debounceTimeout);
  }, [filters, gigId, user?.token]);

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
            // Navigate back to the previous page (gig details)
            router.back();
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

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      minExperience: undefined,
      maxRate: undefined,
      minRate: undefined,
      skills: [],
      availableOnly: false,
      sortBy: 'relevance'
    });
  };

  return (
    <div className={styles.pageContainer}>
      <ScreenHeaderWithBack title="Delegate Gig" />
      
      <div className={styles.contentArea}>
        {/* Enhanced Search Bar */}
        <div className={styles.searchSection}>
          <SearchInput
            value={filters.searchTerm}
            onChange={(value) => updateFilter('searchTerm', value)}
            placeholder="Search by name, skill, or location..."
            className={styles.searchInputArea}
          />
          <button 
            className={styles.filterToggle}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters {showFilters ? '▲' : '▼'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className={styles.filtersSection}>
            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Min Experience (years)</label>
                <input
                  type="number"
                  min="0"
                  value={filters.minExperience || ''}
                  onChange={(e) => updateFilter('minExperience', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>
              
              <div className={styles.filterGroup}>
                <label>Rate Range (£)</label>
                <div className={styles.rateRange}>
                  <input
                    type="number"
                    min="0"
                    value={filters.minRate || ''}
                    onChange={(e) => updateFilter('minRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="0"
                    value={filters.maxRate || ''}
                    onChange={(e) => updateFilter('maxRate', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            <div className={styles.filterRow}>
              <div className={styles.filterGroup}>
                <label>Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => updateFilter('sortBy', e.target.value)}
                >
                  <option value="relevance">Best Match</option>
                  <option value="distance">Distance</option>
                  <option value="experience">Experience</option>
                  <option value="rate">Rate</option>
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>
                  <input
                    type="checkbox"
                    checked={filters.availableOnly}
                    onChange={(e) => updateFilter('availableOnly', e.target.checked)}
                  />
                  Available Only
                </label>
              </div>
            </div>

            <div className={styles.filterActions}>
              <button onClick={clearFilters} className={styles.clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!isLoading && workers.length > 0 && (
          <div className={styles.resultsSummary}>
            Found {workers.length} worker{workers.length !== 1 ? 's' : ''} matching your criteria
          </div>
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