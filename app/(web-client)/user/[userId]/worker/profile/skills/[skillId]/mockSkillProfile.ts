import { SkillProfile } from "./schemas/skillProfile";

export const mockSkillProfile: SkillProfile = {
  workerProfileId: "profile_12345",
  name: "Jane",
  title: "Developer",
  hashtags: ["#React", "#NextJS", "#NodeJS", "#MongoDB"],
  customerReviewsText: "Jane is a highly skilled and reliable developer who always delivers on time.",
  ableGigs: 25,
  experienceYears: 3,
  Eph: "20",
  location: "London, UK",
  address: "123 Baker Street, London, UK",
  latitude: 51.5074,
  longitude: -0.1278,
  videoUrl: "",
  statistics: {
    reviews: 18,
    paymentsCollected: 12.500,
    tipsReceived: 1.200,
  },
  supportingImages: [
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio1.jpg?alt=media&token=abc123",
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio2.jpg?alt=media&token=def456",
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio3.jpg?alt=media&token=ghi789",
  ],
  badges: [
    {
      id: "a1",
      icon: "goldenVibes",
      name: "Golden Vibes",
      description: "Outstanding service during July events",
      awardedAt: new Date("2024-07-01T19:00:00Z"),
      type: 'COMMON'
    },
    {
      id: "a2",
      icon: "alphaGigee",
      name: "Alpha Gigee",
      description: "Recognized for creating great vibes at summer festival",
      awardedAt: new Date("2024-08-10T20:00:00Z"),
      type: 'EARLY_JOINER'
    },
    {
      id: "a3",
      icon: "hostWithTheMost",
      name: "Host With The Most",
      description: "Exemplary conduct and fairness in all gigs",
      awardedAt: new Date("2024-09-01T10:00:00Z"),
      type: 'OTHER'
    },
    {
      id: "a4",
      icon: "foamArtPhenom",
      name: "Foam Art Phenom",
      description: "Mastered coffee art with consistent quality",
      awardedAt: new Date("2024-09-15T14:30:00Z"),
      type: 'OTHER'
    },
    {
      id: "a5",
      icon: "squadRecruiter",
      name: "Squad Recruiter",
      description: "Successfully onboarded 3 new team members",
      awardedAt: new Date("2024-09-20T09:00:00Z"),
      type: 'OTHER'
    },
    {
      id: "a6",
      icon: "firstGigComplete",
      name: "First gig complete",
      description: "Hired first worker through platform",
      awardedAt: new Date("2024-07-05T12:00:00Z"),
      type: 'OTHER'
    }
  ],
  qualifications: [
    {
      id: "q1",
      workerProfileId: "profile_12345",
      title: "B.Sc. Computer Science",
      createdAt: new Date("2019-06-30"),
      updatedAt: new Date("2020-06-30"),
      description: "Graduated with honors from University of London.",
    },
    {
      id: "q2",
      workerProfileId: "profile_12345",
      title: "AWS Certified Developer",
      createdAt: new Date("2021-09-15"),
      updatedAt: new Date("2021-09-15"),
      description: "Certification in AWS cloud solutions and deployment.",
    },
  ],
  buyerReviews: [
    {
      id: "234567",
      author: {fullName: "Michael Smith"},
      createdAt: "2024-08-21",
      comment: "Fantastic work on my e-commerce website! Highly recommend Jane.",
    },
    {
      id: "123456",
      author: {fullName: "Anna Johnson"},
      createdAt: "2024-06-11",
      comment: "Very professional, quick turnaround, and great communication.",
    },
  ],
  recommendations: [
    {
      id: "345678",
      author: {fullName: "David Lee"},
      createdAt: new Date("2024-05-01"),
      comment: "Jane is a great team player and a skilled developer. Would gladly work with her again.",
    },
    {
      id: "4567890",
      author: {fullName: "Sophia Brown"},
      createdAt: new Date("2024-02-15"),
      comment: "Her problem-solving skills are outstanding.",
    },
  ],
};
