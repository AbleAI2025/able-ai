interface Skill {
    name: string;
    ableGigs?: number | string;
    experience?: string;
    eph?: number | string;
}

interface Statistic {
    id: string;
    icon: React.ElementType;
    value: string;
    label: string;
    iconColor?: string;
}

interface Award {
    id: string;
    icon: React.ElementType;
    textLines: string;
}

export default interface PublicWorkerProfile {
    id: string;
    displayName: string;
    userHandle?: string;
    profileHeadline?: string;
    bio?: string;
    avatarUrl?: string;
    profileImageUrl?: string;
    qrCodeUrl?: string;
    location?: string;

    primaryRole?: string;

    statistics?: Statistic[];

    skills?: Skill[];

    awards?: Award[];
    feedbackSummary?: string;

    qualifications?: string[];
    equipment?: string[];

    ableGigsCompleted?: number;
    averageRating?: number;
    reviewCount?: number;
    experienceYears?: number | string;
    isVerified?: boolean;
    viewCalendarLink?: string;
}
