export type SkillProfile = {
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
  }[];
  qualifications: {
    title: string;
    date: string;
    description: string;
  }[];
  buyerReviews: {
    name: string;
    date: Date;
    text: string | null;
  }[];
  recommendation?: {
    name: string;
    date: string;
    text: string;
  };
};
