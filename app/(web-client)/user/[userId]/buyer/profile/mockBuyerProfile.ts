import AwardDisplayBadge from "@/app/components/profile/AwardDisplayBadge";
import DashboardData, { Award } from "@/app/types/BuyerProfileTypes";
import {
  Star,
  Briefcase,
  ThumbsUp,
  Users,
} from "lucide-react";

const dashboardMockData: DashboardData = {
  fullName: "Ethan Johnson",
  username: "ethan.j",
  introVideoThumbnailUrl: "",
  introVideoUrl: "",
  fullCompanyName: "Elite Hospitality Group",
  billingAddressJson: {
    addressLine1: "123 Main Street",
    addressLine2: "Suite 501",
    city: "Nairobi",
    state: "Nairobi County",
    postalCode: "00100",
    country: "Kenya",
    latitude: "-1.2921",
    longitude: "36.8219",
  },
  companyRole: "Hospitality Manager",
  videoUrl: "",

  statistics: [
    { icon: Star, value: "4.8", label: "Average Rating" },
    { icon: ThumbsUp, value: "95%", label: "Response Rate" },
    { icon: Briefcase, value: "120", label: "Completed Hires" },
  ],

  averageRating: 4.8,
  responseRateInternal: 95,
  completedHires: 120,

  skills: ["Bartender", "Waiter", "Chef", "Receptionist", "Housekeeper"],

  pieChartData: [
    { name: "Bartender", value: 30, fill: "#8884d8" },
    { name: "Waiter", value: 25, fill: "#82ca9d" },
    { name: "Chef", value: 20, fill: "#ffc658" },
    { name: "Receptionist", value: 15, fill: "#ff8042" },
    { name: "Housekeeper", value: 10, fill: "#8dd1e1" },
  ],

  barChartData: [
    { name: "Jan", hires: 15, spend: 1200 },
    { name: "Feb", hires: 20, spend: 1600 },
    { name: "Mar", hires: 25, spend: 2100 },
    { name: "Apr", hires: 18, spend: 1500 },
    { name: "May", hires: 30, spend: 2500 },
    { name: "Jun", hires: 22, spend: 1800 },
  ],

  badgesEarnedByTheirWorkers: [
    { id: "1", name: "Top Bartender", icon: Star },
    { id: "2", name: "Best Waitstaff", icon: Users },
    { id: "3", name: "Culinary Expert", icon: Star },
  ],

  reviews: [
    {
      id: "r1",
      name: "Hotel Serena",
      date: "2024-05-01",
      text: "The bartender provided by Elite Hospitality was outstanding and professional.",
    },
    {
      id: "r2",
      name: "Hilton Nairobi",
      date: "2024-06-10",
      text: "Waitstaff were very attentive and made our event seamless.",
    },
    {
      id: "r3",
      name: "Safari Lodge",
      date: "2024-07-15",
      text: "The chef created an incredible dining experience for our guests.",
    },
  ],

badges: [
  {
    id: "a1",
    userId: "user-789",
    badgeId: "firstHire",
    badgeName: "First Hire",
    notes: "Hired first worker successfully",
    awardedAt: new Date("2025-01-05T10:00:00Z"),
    awardedByUserId: "admin-201",
    type: 'other'
  },
  {
    id: "a2",
    userId: "user-789",
    badgeId: "shiftLeader",
    badgeName: "Shift Leader",
    notes: "Led multiple shifts with excellence",
    awardedAt: new Date("2025-02-12T14:30:00Z"),
    awardedByUserId: "admin-202",
    type: 'other'
  },
  {
    id: "a3",
    userId: "user-789",
    badgeId: "bossLevel++",
    badgeName: "Boss Level++",
    notes: "Achieved top management performance",
    awardedAt: new Date("2025-03-01T09:15:00Z"),
    awardedByUserId: "admin-203",
    type: 'other'
  },
  {
    id: "a4",
    userId: "user-789",
    badgeId: "safeShiftHost",
    badgeName: "Safe Shift Host",
    notes: "Ensured all shifts were safe and compliant",
    awardedAt: new Date("2025-03-20T16:45:00Z"),
    awardedByUserId: "admin-204",
    type: 'other'
  },
  {
    id: "a5",
    userId: "user-789",
    badgeId: "goldenVibes",
    badgeName: "Golden Vibes",
    notes: "Consistently created a positive environment",
    awardedAt: new Date("2025-04-10T12:00:00Z"),
    awardedBySystem: true,
    type: 'common'
  }
] as Award[],


  skillCounts: [
    { name: "Bartender", value: 40 },
    { name: "Waiter", value: 35 },
    { name: "Chef", value: 25 },
    { name: "Receptionist", value: 20 },
    { name: "Housekeeper", value: 15 },
  ],

  totalPayments: [
    { name: "Jan", a: 1200 },
    { name: "Feb", a: 1600 },
    { name: "Mar", a: 2100 },
    { name: "Apr", a: 1500 },
    { name: "May", a: 2500 },
    { name: "Jun", a: 1800 },
  ],
};

export default dashboardMockData;
