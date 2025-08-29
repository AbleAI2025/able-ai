// Types
interface Badge {
  id: string;
  name: string;
  icon: React.ElementType;
}
interface Review {
  id: string;
  name: string;
  date: string;
  text: string;
}

export default interface DashboardData {
  fullName: string;
  username: string;
  introVideoThumbnailUrl?: string;
  introVideoUrl?: string;
  fullCompanyName: string;
  billingAddressJson?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
    latitude?: string;
    longitude?: string;
  };
  companyRole: string;
  videoUrl?: string;
  statistics: Array<{
    icon: React.ElementType;
    value: string;
    label: string;
  }>;
  averageRating: number;
  responseRateInternal: number;
  completedHires: number;
  skills: string[];
  pieChartData?: Array<{ name: string; value: number; fill: string }>;
  barChartData?: Array<{ name: string; hires: number; spend?: number }>;
  badgesEarnedByTheirWorkers: Badge[];
  reviews: Review[];
  badges: {
    id: string | number;
    icon?: React.ElementType | null;
    notes: string;
    badge: {
      id: string | number;
      icon?: React.ElementType | null;
      description?: string | null;
    };
  }[];
  skillCounts?: { name: string; value: number }[];
  totalPayments?: { name: string; a: number }[];
}
