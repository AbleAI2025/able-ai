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
  userId: string;
  badgeId: string;
  gigId?: string | null;
  notes?: string | null;
  awardedAt: Date;
  awardedBySystem?: boolean | null;
  awardedByUserId?: string | null;
}

export interface Equipment {
  id: string;
  workerProfileId: string;
  name: string;
  description?: string | null;
  isVerifiedByAdmin?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  gigId: string;
  authorUserId: string;
  targetUserId: string;
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
  institution?: string | null;
  yearAchieved?: number | null;
  description?: string | null;
  documentUrl?: string | null;
  isVerifiedByAdmin?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Availability {
  days: string[];
  hours: string;
}

export interface SemanticProfile {
  tags: string[];
}

export default interface PublicWorkerProfile {
  id?: string | undefined;
  userId?: string | undefined;
  location?: string | undefined;

  fullBio: string | undefined;
  privateNotes?: string;
  averageRating?: number | undefined;

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
  qualifications?: Qualification[];
}
