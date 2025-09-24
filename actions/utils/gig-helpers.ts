import { db } from "@/lib/drizzle/db";
import { and, eq, isNull, or } from "drizzle-orm";
import {
  GigsTable,
  GigWorkerProfilesTable,
  UsersTable,
  gigStatusEnum,
} from "@/lib/drizzle/schema";
import GigDetails from "@/app/types/GigDetailsTypes";

// Constants for worker statistics calculation
const MAX_EXPERIENCE_YEARS = 10;
const MIN_GIGS_FOR_STAR_WORKER = 5;

// Helper to get user by ID
export async function getUserById(userId: string, isDatabaseUserId: boolean) {
  const whereCondition = isDatabaseUserId
    ? eq(UsersTable.id, userId)
    : eq(UsersTable.firebaseUid, userId);

  return await db.query.UsersTable.findFirst({
    where: whereCondition,
    columns: {
      id: true,
      firebaseUid: true,
      fullName: true,
    },
  });
}

// Helper to fetch gig based on role
export async function fetchGigForRole(gigId: string, userId: string, role?: "buyer" | "worker") {
  if (role === "worker") {
    // Worker access: Allow if assigned to the gig or if gig is pending worker acceptance and unassigned
    return await db.query.GigsTable.findFirst({
      where: and(
        eq(GigsTable.id, gigId),
        or(
          eq(GigsTable.workerUserId, userId), // Assigned worker
          and(
            eq(GigsTable.statusInternal, gigStatusEnum.enumValues[0]), // Pending worker acceptance
            isNull(GigsTable.workerUserId) // No worker assigned yet
          )
        )
      ),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
            email: true, // Include buyer's email for notifications
          },
        },
        worker: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  } else {
    // Buyer or fallback access: Check if user is the buyer or worker for the gig
    const columnConditionId = role === "buyer" ? GigsTable.buyerUserId : GigsTable.workerUserId;
    return await db.query.GigsTable.findFirst({
      where: and(eq(columnConditionId, userId), eq(GigsTable.id, gigId)),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
            email: true, // Essential for buyer communication
          },
        },
        worker: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }
}

// Helper to fetch worker profile
export async function fetchWorkerProfile(workerId: string) {
  return await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(GigWorkerProfilesTable.userId, workerId),
  });
}

// Helper to build GigDetails object
export function buildGigDetails(gig: any, worker: any, workerStats: any, startDate: any, endDate: any, durationInHours: number, estimatedEarnings: number, hourlyRate: number, roleDisplay: string): GigDetails {
  return {
    id: gig.id,
    role: roleDisplay,
    gigTitle: gig.titleInternal || "Untitled Gig",
    buyerName: gig.buyer?.fullName || "Unknown",
    date: startDate.format("YYYY-MM-DD"),
    startTime: startDate.toISOString(),
    endTime: endDate.toISOString(),
    duration: `${durationInHours} hours`,
    location: gig?.addressJson || undefined,
    workerViderUrl: worker?.videoUrl,
    workerFullBio: worker?.fullBio,
    hourlyRate: hourlyRate,
    worker: gig?.worker,
    estimatedEarnings: estimatedEarnings,
    specialInstructions: gig.notesForWorker || undefined,
    status: getMappedStatus(gig.statusInternal),
    statusInternal: gig.statusInternal,
    hiringManager: gig.buyer?.fullName || "Manager",
    hiringManagerUsername: gig.buyer?.email || "No email",
    isWorkerSubmittedFeedback: false,
    isBuyerSubmittedFeedback: false,
    workerName: gig.worker?.fullName || undefined,
    workerAvatarUrl: undefined,
    ...workerStats,
  };
}

// Helper function to get mapped status
function getMappedStatus(internalStatus: string): GigDetails["status"] {
  switch (internalStatus) {
    case "PENDING_WORKER_ACCEPTANCE":
      return "PENDING";
    case "ACCEPTED":
      return "ACCEPTED";
    case "COMPLETED":
      return "COMPLETED";
    case "CANCELLED_BY_BUYER":
    case "CANCELLED_BY_WORKER":
    case "CANCELLED_BY_ADMIN":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

// Helper to calculate worker statistics
export async function calculateWorkerStats(workerId: string) {
  const completedGigs = await db.query.GigsTable.findMany({
    where: and(
      eq(GigsTable.workerUserId, workerId),
      eq(GigsTable.statusInternal, "COMPLETED")
    ),
    columns: { id: true },
  });
  const workerGigs = completedGigs.length;
  const workerExperience = Math.min(workerGigs, MAX_EXPERIENCE_YEARS);
  const isWorkerStar = workerGigs >= MIN_GIGS_FOR_STAR_WORKER;
  return { workerGigs, workerExperience, isWorkerStar };
}

// Helper for error handling
export function handleGigError(error: unknown) {
  console.error("Error fetching gig:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error fetching gig",
    gig: {} as GigDetails,
    status: 500,
  };
}