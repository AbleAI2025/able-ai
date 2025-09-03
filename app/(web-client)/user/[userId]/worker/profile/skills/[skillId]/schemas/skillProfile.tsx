import {BadgeIcon } from "@/app/components/profile/GetBadgeIcon";

export type SkillProfile = {
  profileId?: string;
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
    id: string;
    type: "COMMON" | "EARLY_JOINER" | "OTHER";
    name: string;
    icon?: BadgeIcon;
    description?: string | null;
    awardedAt: Date;
    awardedBySystem?: boolean | null;
  }[] | undefined;
  qualifications: {
    title: string;
    date: string;
    description: string;
  }[];
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
