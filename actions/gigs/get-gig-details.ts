"use server";
import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import {
  BuyerProfilesTable,
  GigsTable,
  GigWorkerProfilesTable,
} from "@/lib/drizzle/schema";
import moment from "moment";
import GigDetails from "@/app/types/GigDetailsTypes";
import {
  getUserById,
  fetchGigForRole,
  fetchWorkerProfile,
  calculateWorkerStats,
  buildGigDetails,
  handleGigError,
} from "../utils/gig-helpers";
// Helper function to extract location from an object
function extractLocationFromObject(obj: any): string | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;

  // Handle address objects - prioritize readable text over coordinates
  if (obj.formatted_address) {
    return obj.formatted_address;
  }

  // Handle other address fields
  if (obj.address) {
    return obj.address;
  }

  // Handle street address components
  if (obj.street_address || obj.route) {
    const parts = [];
    if (obj.street_number) parts.push(obj.street_number);
    if (obj.route) parts.push(obj.route);
    if (obj.locality) parts.push(obj.locality);
    if (obj.administrative_area_level_1)
      parts.push(obj.administrative_area_level_1);
    if (obj.postal_code) parts.push(obj.postal_code);
    if (obj.country) parts.push(obj.country);

    if (parts.length > 0) {
      return parts.join(", ");
    }
  }

  // Only use coordinates as a last resort if no readable address is available
  if (
    obj.lat &&
    obj.lng &&
    typeof obj.lat === "number" &&
    typeof obj.lng === "number"
  ) {
    return `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
  }

  return null;
}

// Helper function to extract location from a string
function extractLocationFromString(str: string): string | null {
  if (!str || typeof str !== "string") return null;

  // Check if it's a URL first
  if (str.startsWith("http")) {
    return `Map Link: ${str}`;
  }

  // Check if it's already a formatted location string (prioritize readable text)
  if (
    str.includes(",") &&
    !str.includes("[object Object]") &&
    !str.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)
  ) {
    return str;
  }

  // Only use coordinates as a last resort if no readable text is available
  if (str.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
    return `Coordinates: ${str}`;
  }

  return null;
}

// Helper function to extract location from any data type (object or string)
function extractLocationFromData(data: any): string | null {
  if (!data) return null;

  if (typeof data === "string") {
    return extractLocationFromString(data);
  }

  if (typeof data === "object") {
    return extractLocationFromObject(data);
  }

  return null;
}

// Helper function to perform aggressive location extraction from an object
function extractLocationAggressively(obj: any): string | null {
  if (!obj || typeof obj !== "object") return null;

  // Prioritize readable address text over coordinates
  if (obj.formatted_address) {
    return obj.formatted_address;
  }

  if (obj.address) {
    return obj.address;
  }

  if (obj.street && obj.city) {
    return `${obj.street}, ${obj.city}`;
  }

  // Show any available string data (but not coordinates)
  for (const [key, value] of Object.entries(obj)) {
    if (
      typeof value === "string" &&
      value.trim() &&
      value !== "null" &&
      value !== "undefined" &&
      value !== "[object Object]" &&
      !value.includes("[object Object]") &&
      !value.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)
    ) {
      return value.trim();
    }
  }

  // Only use coordinates as absolute last resort
  if (obj.lat && obj.lng) {
    return `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
  }

  return null;
}

export async function getGigDetails({
  gigId,
  userId,
  role,
  isDatabaseUserId = false,
}: {
  gigId: string;
  userId: string;
  role?: "buyer" | "worker";
  isViewQA?: boolean;
  isDatabaseUserId?: boolean;
}) {
  if (!userId) {
    return { error: "User id is required", gig: {} as GigDetails, status: 404 };
  }

  try {
    const user = await getUserById(userId, isDatabaseUserId);
    if (!user) {
      return { error: "User is not found", gig: {} as GigDetails, status: 404 };
    }

    const gig = await fetchGigForRole(gigId, user.id, role);
    if (!gig) {
      return { error: "Gig not found", gig: {} as GigDetails, status: 404 };
    }

    const worker = await fetchWorkerProfile(gig.worker?.id || "");

    const startDate = moment(gig.startTime);
    const endDate = moment(gig.endTime);
    const durationInHours = endDate.diff(startDate, "hours", true);
    const estimatedEarnings = gig.totalAgreedPrice
      ? parseFloat(gig.totalAgreedPrice)
      : 0;
    const hourlyRate = gig.agreedRate ? parseFloat(gig.agreedRate) : 0;
    const roleDisplay = gig.titleInternal || "Gig Worker";

    const workerStats = gig.worker?.id
      ? await calculateWorkerStats(gig.worker.id)
      : { workerGigs: 0, workerExperience: 0, isWorkerStar: false };

    const gigDetails = buildGigDetails(
      gig,
      worker,
      workerStats,
      startDate,
      endDate,
      durationInHours,
      estimatedEarnings,
      hourlyRate,
      roleDisplay
    );

    return { success: true, gig: gigDetails, status: 200 };
  } catch (error: unknown) {
    return handleGigError(error);
  }
}

export const getGigForBuyerFeedback = async (gigId: string) => {
  try {
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            appRole: true,
          },
        },
        worker: {
          columns: {
            id: true,
            fullName: true,
            appRole: true,
          },
        },
        skillsRequired: { columns: { skillName: true } },
        payments: { columns: { paidAt: true } },
      },
    });

    if (!gig) {
      throw new Error("Gig not found");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, gig.worker?.id || ""),
    });

    if (!workerProfile) {
      throw new Error("Gig has no assigned worker");
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const data = {
      id: gigId,
      role: gig.skillsRequired[0]?.skillName || gig.worker?.fullName,
      workerName: gig.worker?.fullName,
      workerAvatarUrl: workerProfile.videoUrl,
      workerId: gig.worker?.id,
      date: gig.createdAt.toISOString(),
      hourlyRate: gig.agreedRate,
      hoursWorked: gig.finalHours,
      totalPayment: gig.finalAgreedPrice,
      duration: gig.estimatedHours,
      location:
        extractLocationFromData(gig?.addressJson) ||
        extractLocationFromData(gig?.exactLocation) ||
        "Location not provided",
      completedAt:
        gig.payments[0]?.paidAt?.toLocaleString("en-US", options) ||
        gig.updatedAt?.toLocaleString("en-US", options),
      details: gig.fullDescription,
      earnings: gig.totalAgreedPrice,
    };

    return { success: true, data, status: 200 };
  } catch (error: unknown) {
    console.error("Error fetching gig:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error fetching gig",
      gig: {} as GigDetails,
      status: 500,
    };
  }
};

export const getGigForWorkerFeedback = async (gigId: string) => {
  try {
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
            email: true,
            appRole: true,
          },
        },
        worker: {
          columns: {
            id: true,
            fullName: true,
            appRole: true,
          },
        },
        skillsRequired: { columns: { skillName: true } },
        payments: { columns: { paidAt: true } },
      },
    });

    if (!gig) {
      throw new Error("Gig not found");
    }

    if (!gig.worker) {
      throw new Error("Gig has no assigned worker");
    }

    const BuyerProfile = await db.query.BuyerProfilesTable.findFirst({
      where: eq(BuyerProfilesTable.userId, gig.buyer?.id || ""),
    });

    if (!BuyerProfile) {
      throw new Error("Gig has no assigned buyer profile");
    }

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    };

    const data = {
      id: gigId,
      role: BuyerProfile?.companyRole,
      buyerName: gig.buyer?.fullName,
      buyerAvatarUrl: BuyerProfile?.videoUrl,
      buyerId: gig.buyer?.id,
      date: gig.createdAt.toISOString(),
      hourlyRate: gig.agreedRate,
      hoursWorked: gig.finalHours,
      totalPayment: gig.finalAgreedPrice,
      duration: gig.estimatedHours,
      location:
        extractLocationFromData(gig?.addressJson) ||
        extractLocationFromData(gig?.exactLocation) ||
        "Location not provided",
      completedAt:
        gig.payments[0]?.paidAt?.toLocaleString("en-US", options) ||
        gig.updatedAt?.toLocaleString("en-US", options),
      details: gig.fullDescription,
      earnings: gig.totalAgreedPrice,
    };

    return { success: true, data, status: 200 };
  } catch (error: unknown) {
    console.error("Error fetching gig:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error fetching gig",
      gig: {} as GigDetails,
      status: 500,
    };
  }
};
