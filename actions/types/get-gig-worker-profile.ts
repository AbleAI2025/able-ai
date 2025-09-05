
export interface CreateSkillData {
  name: string;
  experienceYears: number;
  agreedRate: number | string;
  skillVideoUrl?: string;
  adminTags?: string[];
  images?: string[];
}

export interface AvailabilityData {
  days: string[];
  startTime: string;
  endTime: string;
  frequency?: string;
  ends?: string;
  startDate?: string;
  endDate?: string;
  occurrences?: number;
}

export interface EquipmentData {
  name: string;
  description?: string;
}

export interface OnboardingProfileData {
  about: string;
  experience: string;
  skills: string;
  hourlyRate: string;
  location: any;
  availability: AvailabilityData | string;
  videoIntro: File | string;
  jobTitle?: string;
  equipment?: EquipmentData[];
}

export interface ActionResult<T = any> {
  success: boolean;
  data: T | null;
  error?: string;
  workerProfileId?: string;
}

export interface SkillProfile {
  profileId?: string;
  name?: string;
  title?: string;
  hashtags: string;
  customerReviewsText?: string | null;
  ableGigs?: any;
  experienceYears?: number;
  Eph?: string;
  location: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  videoUrl: string;
  statistics: {
    reviews?: number;
    paymentsCollected: string;
    tipsReceived: string;
  };
  supportingImages: string[];
  badges: any[];
  qualifications: any[];
  buyerReviews: any[];
  recommendations: any[];
}