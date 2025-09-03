import { SkillProfile } from "./schemas/skillProfile";

export const mockSkillProfile: SkillProfile = {
  workerProfileId: "profile_12345",
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
      id: 1,
      icon: null,
      notes: "Top Rated Freelancer of 2024",
      badge: {
        id: "b1",
        icon: null,
        description: "Awarded for consistent 5-star reviews and reliability.",
      },
    },
    {
      id: 2,
      icon: null,
      notes: "React Expert",
      badge: {
        id: "b2",
        icon: null,
        description: "Specialist in React and Next.js applications.",
      },
    },
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
