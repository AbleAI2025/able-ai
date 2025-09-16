import type { BadgeIcon } from "../components/profile/GetBadgeIcon";

export interface Skill {
  id: string;
  workerProfileId: string;
  name: string;
  experienceYears: number;
  agreedRate: string;
  skillVideoUrl?: string | null;
  adminTags?: string[] | null;
  ableGigs?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Award {
  id: string;
  type: "COMMON" | "EARLY_JOINER" | "OTHER";
  name: string;
  icon: BadgeIcon;
  description?: string | null;
  awardedAt: Date;
  awardedBySystem?: boolean | null;
}

export interface Equipment {
  id: string;
  workerProfileId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  gigId: string | null;
  authorUserId: string | null;
  targetUserId: string | null;
  rating: number;
  comment: string | null;
  wouldWorkAgain?: boolean | null;
  awardedBadgeNamesToTargetJson?: string[] | unknown;
  isPublic: boolean;
  type: string;
  moderationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Qualification {
  id: string;
  workerProfileId: string;
  title: string;
  description: string | null;
  yearAchieved?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  days: string[];
  hours: string;
}

export interface SemanticProfile {
  tags: string[];
  qualifications?: string[];
}

export default interface PublicWorkerProfile {
  id: string;
  userId?: string | undefined;
  location: string | { formatted_address: string; [key: string]: any } | undefined;
  user?: {
    fullName: string | undefined;
    rtwStatus?:
      | "NOT_SUBMITTED"
      | "PENDING"
      | "VERIFIED"
      | "ACCEPTED"
      | "EXPIRED"
      | "NOT_FOUND"
      | "LOCKED"
      | "REJECTED"
      | undefined;
  };

  fullBio: string | undefined;
  privateNotes?: string;
  averageRating?: number | undefined;
  hashtags?: string[];

  responseRateInternal?: string | undefined;

  availabilityJson?: Availability;
  semanticProfileJson?: SemanticProfile;
  videoUrl?: string | undefined;

  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;

  awards?: Award[];
  equipment?: Equipment[];
  skills?: Skill[];
  reviews?: Review[];
  socialLink?: string | null;
  qualifications?: Qualification[];
  recommendations?: Review[];
}
