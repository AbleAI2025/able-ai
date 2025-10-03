export interface Worker {
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

export interface SearchFilters {
  searchTerm: string;
  minExperience?: number;
  maxRate?: number;
  minRate?: number;
  skills: string[];
  availableOnly: boolean;
  sortBy: 'relevance' | 'distance' | 'experience' | 'rate';
}