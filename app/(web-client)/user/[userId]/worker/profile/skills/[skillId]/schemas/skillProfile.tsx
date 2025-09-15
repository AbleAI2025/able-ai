import { BadgeIcon } from "@/app/components/profile/GetBadgeIcon";
import { Qualification } from "@/app/types";

type authorType = {
  fullName: string;
};

type buyerReviews = {
  id: string;
  author: authorType | null;
  createdAt: Date | string;
  comment: string | null;
}[];

type recommendations = {
  id: string;
  recommenderName?: string | null | undefined;
  author: authorType | null;
  createdAt: Date | null;
  comment: string | null;
}[];

export type SkillProfile = {
  workerProfileId?: string;
  name?: string;
  title?: string;
  hashtags?: string[];
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
    reviews?: number;
    paymentsCollected: number;
    tipsReceived: number;
  };
  supportingImages: string[];
  badges:
    | {
        id: string;
        type: "COMMON" | "EARLY_JOINER" | "OTHER";
        name: string;
        icon?: BadgeIcon | string | null;
        description?: string | null;
        awardedAt: Date;
        awardedBySystem?: boolean | null;
      }[]
    | undefined;
  qualifications: Qualification[];
  buyerReviews?: buyerReviews | undefined;
  recommendations?: recommendations | undefined;
};
