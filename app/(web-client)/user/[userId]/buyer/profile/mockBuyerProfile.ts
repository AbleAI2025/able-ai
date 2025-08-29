import DashboardData from "@/app/types/BuyerProfileTypes";
import {
  Star,
  Briefcase,
  Award,
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
    { id: "1", name: "Top Bartender", icon: Award },
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
      id: "b1",
      notes: "Awarded for excellent bartending services",
      badge: { id: "badge1", icon: Star, description: "Star Bartender" },
    },
    {
      id: "b2",
      notes: "Recognized for top-quality waiting service",
      badge: { id: "badge2", icon: Users, description: "Top Waiter" },
    },
    {
      id: "b3",
      notes: "Exceptional culinary expertise",
      badge: { id: "badge3", icon: Award, description: "Culinary Expert" },
    },
  ],

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
