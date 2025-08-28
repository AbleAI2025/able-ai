import PublicWorkerProfile, {
  Skill,
  Award,
  Equipment,
  Review,
  Qualification,
  Availability,
  SemanticProfile,
} from '@/app/types/workerProfileTypes';


export const mockWorkerProfile: PublicWorkerProfile = {
  id: "01b15a22-9b4d-4c10-b7a6-726bd638023a",
  userId: "user-456",
  location: "London, UK",

  fullBio:
    "Passionate mixologist and event professional with 5+ years of experience in crafting unforgettable guest experiences.",
  privateNotes: "Strong candidate for premium gigs",
  averageRating: 0,

  responseRateInternal: "95%",

  availabilityJson: {
    days: ["Monday", "Friday", "Saturday", "Sunday"],
    hours: "Evenings and weekends",
  } as Availability,

  semanticProfileJson: {
    tags: ["Outgoing", "Customer-focused", "Reliable", "Cocktail enthusiast"],
  } as SemanticProfile,

  videoUrl: "",

  createdAt: new Date("2024-01-10T12:00:00Z"),
  updatedAt: new Date("2024-08-25T15:30:00Z"),

  awards: [
    {
      id: "a1",
      userId: "user-456",
      badgeId: "badge-top-performer",
      notes: "Outstanding service during July events",
      awardedAt: new Date("2024-07-01T19:00:00Z"),
      awardedBySystem: true,
    },
    {
      id: "a2",
      userId: "user-456",
      badgeId: "badge-golden-vibes",
      notes: "Recognized for creating great vibes at summer festival",
      awardedAt: new Date("2024-08-10T20:00:00Z"),
      awardedByUserId: "admin-101",
    },
  ] as Award[],

  equipment: [
    {
      id: "e1",
      workerProfileId: "worker-123",
      name: "Cocktail Shaker",
      description: "Professional-grade shaker kit",
      isVerifiedByAdmin: true,
      createdAt: new Date("2024-02-15T12:00:00Z"),
      updatedAt: new Date("2024-06-01T14:30:00Z"),
    },
    {
      id: "e2",
      workerProfileId: "worker-123",
      name: "Portable Bar Kit",
      description: "All-in-one bar setup for events",
      isVerifiedByAdmin: false,
      createdAt: new Date("2024-03-10T11:00:00Z"),
      updatedAt: new Date("2024-05-22T16:00:00Z"),
    },
  ] as Equipment[],

  skills: [
    {
      id: "s1",
      workerProfileId: "worker-123",
      name: "Mixology",
      experienceYears: 5,
      agreedRate: "£25/hr",
      skillVideoUrl: "https://example.com/mixology-demo.mp4",
      adminTags: ["Drinks", "Cocktails"],
      ableGigs: 12,
      createdAt: new Date("2023-01-15T10:00:00Z"),
      updatedAt: new Date("2024-06-20T14:30:00Z"),
    },
    {
      id: "s2",
      workerProfileId: "worker-123",
      name: "Customer Service",
      experienceYears: 4,
      agreedRate: "£20/hr",
      adminTags: ["Hospitality"],
      ableGigs: 8,
      createdAt: new Date("2023-03-01T09:00:00Z"),
      updatedAt: new Date("2024-06-18T13:45:00Z"),
    },
  ] as Skill[],

  reviews: [
    {
      id: "r1",
      gigId: "gig-789",
      authorUserId: "client-123",
      targetUserId: "user-456",
      rating: 5,
      comment:
        "Fantastic bartender, kept the guests entertained and happy all night!",
      wouldWorkAgain: true,
      awardedBadgeNamesToTargetJson: ["Top Performer"],
      isPublic: true,
      type: "client-review",
      moderationStatus: "approved",
      createdAt: new Date("2024-07-12T19:00:00Z"),
      updatedAt: new Date("2024-07-13T12:00:00Z"),
    },
    {
      id: "r2",
      gigId: "gig-790",
      authorUserId: "client-124",
      targetUserId: "user-456",
      rating: 4,
      comment: "Great service, punctual and professional.",
      wouldWorkAgain: true,
      isPublic: true,
      type: "client-review",
      moderationStatus: "approved",
      createdAt: new Date("2024-08-05T18:00:00Z"),
      updatedAt: new Date("2024-08-06T10:00:00Z"),
    },
  ] as Review[],

  qualifications: [
    {
      id: "q1",
      workerProfileId: "worker-123",
      title: "Food & Beverage Safety Certified",
      institution: "Hospitality Institute UK",
      yearAchieved: 2021,
      description: "Certification for food and beverage handling safety",
      documentUrl: "https://example.com/fb-cert.pdf",
      isVerifiedByAdmin: true,
      createdAt: new Date("2021-06-10T12:00:00Z"),
      updatedAt: new Date("2024-06-01T14:30:00Z"),
    },
    {
      id: "q2",
      workerProfileId: "worker-123",
      title: "Mixology Masterclass",
      institution: "London Bartending School",
      yearAchieved: 2022,
      description: "Advanced mixology techniques and bar management",
      isVerifiedByAdmin: false,
      createdAt: new Date("2022-08-20T10:00:00Z"),
      updatedAt: new Date("2024-05-10T15:00:00Z"),
    },
  ] as Qualification[],
};
