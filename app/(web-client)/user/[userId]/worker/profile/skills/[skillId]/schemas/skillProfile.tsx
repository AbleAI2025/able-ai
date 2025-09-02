import { Qualification } from "@/app/types";

export type SkillProfile = {
  workerProfileId: string;
  name?: string;
  title?: string;
  hashtags?: string;
  customerReviewsText?: string | null;
  ableGigs?: number | null;
  experienceYears?: number | null;
  Eph?: string | null;
  location?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  videoUrl?: string | null;
  statistics: {
    reviews: number;
    paymentsCollected: string;
    tipsReceived: string;
  };
  supportingImages: string[];
  badges: {
    id: string | number;
    icon?: React.ElementType | null;
    notes: string;
    badge: {
      id: string | number;
      icon?: React.ElementType | null;
      description?: string | null
    }
  }[];
  qualifications: Qualification[];
  buyerReviews: {
    name: string;
    date: Date | string;
    text: string | null;
  }[];
  recommendations?: {
    name: string;
    date: Date | null;
    text: string | null;
  }[];
};
