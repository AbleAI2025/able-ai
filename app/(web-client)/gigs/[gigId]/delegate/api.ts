import { Worker, SearchFilters } from './types';

// Enhanced API functions with filters
export async function fetchPotentialDelegates(gigId: string, filters: SearchFilters, token: string): Promise<Worker[]> {
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

export async function delegateGigToWorkerAPI(gigId: string, workerId: string, token: string): Promise<{success: boolean, message?: string}> {
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