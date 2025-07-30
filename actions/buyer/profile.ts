import { Award, MessageCircleCode, Sparkles, ThumbsUp } from "lucide-react";

interface Badge {
    id: string;
    name: string;
    icon: React.ElementType;
}
interface Review {
    id: string;
    workerName: string;
    date: string;
    reviewText: string;
    rating: number;
    workerAvatarUrl?: string;
}
export interface DashboardData {
    displayName: string;
    username: string;
    introVideoThumbnailUrl?: string;
    introVideoUrl?: string;
    businessName: string;
    businessLocation: string;
    userRoleInBusiness: string;
    statistics: Array<{
        icon: React.ElementType,
        value: string,
        label: string
    }>
    completedHires: number;
    typesOfStaffHired: string[];
    pieChartData?: Array<{ name: string; value: number; fill: string }>;
    barChartData?: Array<{ name: string; hires: number; spend?: number }>;
    badgesEarnedByTheirWorkers: Badge[];
    reviewsFromWorkers: Review[];
}

const mockDashboardData: DashboardData = {
    displayName: "Alexander Smith",
    username: "@AlexanderS",
    introVideoThumbnailUrl: "/images/benji.jpeg",
    introVideoUrl: "https://www.youtube.com/watch?v=some_video_id",
    businessName: "Friendship Cafe and Bar",
    businessLocation: "Soho, W1 56T",
    userRoleInBusiness: "Owner, manager",
    statistics: [
    {
      icon: ThumbsUp,
      value: "100%",
      label: "Would work with Alexandra again"
    },
    {
      icon: MessageCircleCode,
      value: "100%",
      label: "Response rate",
    }],
    completedHires: 150,
    typesOfStaffHired: ["Waiters", "Bartender", "Chef"],
    pieChartData: [
        { name: "Bartenders", value: 400, fill: "#FFBB28" },
        { name: "Waiters", value: 300, fill: "#00C49F" },
        { name: "Chefs", value: 300, fill: "#0088FE" },
        { name: "Event Staff", value: 200, fill: "#FF8042" },
    ],
    barChartData: [
        { name: "Jan", hires: 10, spend: 1500 },
        { name: "Feb", hires: 12, spend: 1800 },
        { name: "Mar", hires: 15, spend: 2200 },
        { name: "Apr", hires: 13, spend: 2000 },
    ],
    badgesEarnedByTheirWorkers: [
        { id: "b1", name: "Mixology Master Hired", icon: Award },
        { id: "b2", name: "Consistent Positive Feedback", icon: ThumbsUp },
        { id: "b3", name: "Top Venue Choice", icon: Sparkles }
    ],
    reviewsFromWorkers: [
        { id: "rw1", workerName: "Benji A.", date: "2023-10-15", reviewText: "Alexander is a great manager, very clear with instructions and fair. Always a pleasure to work for Friendship Cafe!", rating: 5, workerAvatarUrl: "/images/benji.jpeg" },
        { id: "rw2", workerName: "Sarah K.", date: "2023-09-20", reviewText: "Professional environment and prompt payment. Would definitely work with Alexander again.", rating: 4, workerAvatarUrl: "/images/jessica.jpeg" },
    ],
};

export async function getGigWorkerProfile({ userId }: { userId?: string }) {
  try {
    if (!userId) {
      return { error: "User ID is required", profile: null, status: 400 };
    }

    /*
    const workerProfile = await db.query.WorkerProfilesTable.findFirst({
      where: eq(WorkerProfilesTable.userId, userId),
      with: {
        skills: true,
        statistics: true,
        awards: true,
      },
    });

    if (!workerProfile) {
      return { error: "Worker profile not found", profile: null, status: 404 };
    }
    */

    return { profile: mockDashboardData, success: true, status: 200 };

  } catch (error) {
    console.error("Error fetching worker profile:", error);
    return { error: "Internal server error", profile: null, status: 500 };
  }
}