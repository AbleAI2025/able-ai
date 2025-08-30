import { SkillProfile } from "./schemas/skillProfile";

export const mockSkillProfile: SkillProfile = {
  profileId: "profile_12345",
  name: "Jane",
  title: "Developer",
  hashtags: "#React #NextJS #NodeJS #MongoDB",
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
    paymentsCollected: "£12,500",
    tipsReceived: "£1,200",
  },
  supportingImages: [
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio1.jpg?alt=media&token=abc123",
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio2.jpg?alt=media&token=def456",
    "https://firebasestorage.googleapis.com/v0/b/demo-app.appspot.com/o/portfolio3.jpg?alt=media&token=ghi789",
  ],
  badges: [
    {
      id: "a1",
      badgeId: "goldenVibes",
      badgeName: "Golden Vibes",
      notes: "Outstanding service during July events",
      awardedAt: new Date("2024-07-01T19:00:00Z"),
      type: 'common'
    },
    {
      id: "a2",
      badgeId: "alphaGigee",
      badgeName: "Alpha Gigee",
      notes: "Recognized for creating great vibes at summer festival",
      awardedAt: new Date("2024-08-10T20:00:00Z"),
      type: 'earlyJoiner'
    },
    {
      id: "a3",
      badgeId: "hostWithTheMost",
      badgeName: "Host With The Most",
      notes: "Exemplary conduct and fairness in all gigs",
      awardedAt: new Date("2024-09-01T10:00:00Z"),
      type: 'other'
    },
    {
      id: "a4",
      badgeId: "foamArtPhenom",
      badgeName: "Foam Art Phenom",
      notes: "Mastered coffee art with consistent quality",
      awardedAt: new Date("2024-09-15T14:30:00Z"),
      type: 'other'
    },
    {
      id: "a5",
      badgeId: "squadRecruiter",
      badgeName: "Squad Recruiter",
      notes: "Successfully onboarded 3 new team members",
      awardedAt: new Date("2024-09-20T09:00:00Z"),
      type: 'other'
    },
    {
      id: "a6",
      badgeId: "firstGigComplete",
      badgeName: "First gig complete",
      notes: "Hired first worker through platform",
      awardedAt: new Date("2024-07-05T12:00:00Z"),
      type: 'other'
    }
  ],
  qualifications: [
    {
      title: "B.Sc. Computer Science",
      date: "2019-06-30",
      description: "Graduated with honors from University of London.",
    },
    {
      title: "AWS Certified Developer",
      date: "2021-09-15",
      description: "Certification in AWS cloud solutions and deployment.",
    },
  ],
  buyerReviews: [
    {
      name: "Michael Smith",
      date: "2024-08-21",
      text: "Fantastic work on my e-commerce website! Highly recommend Jane.",
    },
    {
      name: "Anna Johnson",
      date: "2024-06-11",
      text: "Very professional, quick turnaround, and great communication.",
    },
  ],
  recommendations: [
    {
      name: "David Lee",
      date: new Date("2024-05-01"),
      text: "Jane is a great team player and a skilled developer. Would gladly work with her again.",
    },
    {
      name: "Sophia Brown",
      date: new Date("2024-02-15"),
      text: "Her problem-solving skills are outstanding.",
    },
  ],
};
