import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Worker, SearchFilters } from './types';
import { fetchPotentialDelegates, delegateGigToWorkerAPI } from './api';

export function useDelegateGig(gigId: string) {
  const router = useRouter();
  const { user } = useAuth();

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

  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
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

  return {
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
  };
}