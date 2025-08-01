export interface Skill {
  id: string;
  workerProfileId: string;
  name: string;
  experienceMonths: number;
  agreedRate: string;
  skillVideoUrl?: string;
  adminTags?: string[];
  ableGigs?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Award {
  id: string;
  name: string;
  description: string;
  iconUrlOrLucideName: string;
  type: string;
  criteriaJson?: {
    min_skills?: number;
    experience_months?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Equipment {
  id: string;
  workerProfileId: string;
  name: string;
  description: string;
  isVerifiedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  gigId: string;
  authorUserId: string;
  targetUserId: string;
  rating: number;
  comment: string;
  wouldWorkAgain: boolean;
  awardedBadgeNamesToTargetJson: string[];
  isPublic: boolean;
  type: string;
  moderationStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Qualification {
  id: string;
  workerProfileId: string;
  title: string;
  institution: string;
  yearAchieved: number;
  description: string;
  documentUrl: string;
  isVerifiedByAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  days: string[];
  hours: string;
}

export interface SemanticProfile {
  tags: string[];
}

export default interface PublicWorkerProfile {
  id: string;
  userId: string;

  fullBio: string;
  privateNotes?: string;

  responseRateInternal: string;

  availabilityJson?: Availability;
  semanticProfileJson?: SemanticProfile;

  createdAt: string;
  updatedAt: string;

  awards?: Award[];
  equipment?: Equipment[];
  skills?: Skill[];
  reviews?: Review[];
  qualifications?: Qualification[];
}
