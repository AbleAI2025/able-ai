"use server";

import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import { gigStatusEnum, UsersTable, GigsTable } from "@/lib/drizzle/schema";

// Gig statuses for offers (pending worker acceptance)
const PENDING_WORKER_ACCEPTANCE = gigStatusEnum.enumValues[0];
const PAYMENT_HELD_PENDING_ACCEPTANCE = gigStatusEnum.enumValues[1];

// Gig statuses for accepted gigs
const ACCEPTED = gigStatusEnum.enumValues[2];
const IN_PROGRESS = gigStatusEnum.enumValues[4];
const PENDING_COMPLETION_WORKER = gigStatusEnum.enumValues[5];
const PENDING_COMPLETION_BUYER = gigStatusEnum.enumValues[6];
const COMPLETED = gigStatusEnum.enumValues[7];
const AWAITING_PAYMENT = gigStatusEnum.enumValues[8];
const PAID = gigStatusEnum.enumValues[9];

// Debug: Log the actual enum values
console.log("Debug - Enum values:", gigStatusEnum.enumValues);
console.log("Debug - PENDING_WORKER_ACCEPTANCE:", PENDING_WORKER_ACCEPTANCE);
console.log("Debug - ACCEPTED:", ACCEPTED);

export interface WorkerGigOffer {
  id: string;
  role: string;
  buyerName: string;
  locationSnippet: string;
  dateString: string;
  timeString: string;
  hourlyRate: number;
  estimatedHours?: number;
  totalPay?: number;
  tipsExpected?: boolean;
  expiresAt?: string;
  status: string;
  fullDescriptionLink?: string;
  gigDescription?: string;
  notesForWorker?: string;
}
interface AddressJson {
  formatted_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}
// Define a type with only the fields you need
type MinimalGig = Pick<
  typeof GigsTable.$inferSelect,
  | "id"
  | "buyerUserId"
  | "workerUserId"
  | "titleInternal"
  | "fullDescription"
  | "exactLocation"
  | "addressJson"
  | "startTime"
  | "endTime"
  | "agreedRate"
  | "statusInternal"
  | "notesForWorker"
>;

// Use MinimalGig in your function
function transformGigToWorkerOffer(
  gig: MinimalGig,
  userId: string,
  statusOverride?: string
): WorkerGigOffer {
  const startDate = new Date(gig.startTime);
  const endDate = new Date(gig.endTime);

  const hoursDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const estimatedHours = Math.round(hoursDiff * 100) / 100;
  const totalPay = Number(gig.agreedRate) * estimatedHours;

  const dateString = startDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const timeString = `${startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} - ${endDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;

  let locationSnippet = "Location not specified";
  if (gig.addressJson && typeof gig.addressJson === "object") {
    const address = gig.addressJson as AddressJson;
    if (address.formatted_address) {
      locationSnippet = address.formatted_address;
    } else if (address.street_address) {
      locationSnippet = address.street_address;
    } else if (address.city && address.country) {
      locationSnippet = `${address.city}, ${address.country}`;
    }
  } else if (gig.exactLocation) {
    locationSnippet = gig.exactLocation;
  }

  return {
    id: gig.id,
    role: gig.titleInternal,
    buyerName: "Buyer (Details not loaded)",
    locationSnippet,
    dateString,
    timeString,
    hourlyRate: Number(gig.agreedRate),
    estimatedHours,
    totalPay: Math.round(totalPay * 100) / 100,
    tipsExpected: false,
    status: statusOverride ?? gig.statusInternal,
    fullDescriptionLink: `/user/${userId}/worker/gigs/${gig.id}`,
    gigDescription: gig.fullDescription || undefined,
    notesForWorker: gig.notesForWorker || undefined,
  };
}

export async function getWorkerOffers(userId: string) {
  try {
    console.log("Debug - getWorkerOffers called with userId:", userId);

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });

    console.log("Debug - User found:", user);

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    console.log("Debug - Using simplified approach...");

    const allGigs = await db.query.GigsTable.findMany({
      columns: {
        id: true,
        titleInternal: true,
        statusInternal: true,
        workerUserId: true,
        buyerUserId: true,
        startTime: true,
        endTime: true,
        agreedRate: true,
        fullDescription: true,
        notesForWorker: true,
        addressJson: true,
        exactLocation: true,
      },
    });

    console.log("Debug - Total gigs fetched:", allGigs.length);

    const offerGigs = allGigs.filter(
      (gig) =>
        gig.statusInternal === PENDING_WORKER_ACCEPTANCE &&
        !gig.workerUserId &&
        gig.buyerUserId !== user.id
    );

    const acceptedGigs = allGigs.filter(
      (gig) =>
        gig.workerUserId === user.id &&
        (
          [
            ACCEPTED,
            IN_PROGRESS,
            PENDING_COMPLETION_WORKER,
            PENDING_COMPLETION_BUYER,
            COMPLETED,
            AWAITING_PAYMENT,
            PAID,
          ] as string[]
        ).includes(gig.statusInternal)
    );

    const offers: WorkerGigOffer[] = offerGigs.map((gig) =>
      transformGigToWorkerOffer(gig, userId, "pending")
    );

    const accepted: WorkerGigOffer[] = acceptedGigs.map((gig) =>
      transformGigToWorkerOffer(gig, userId)
    );

    console.log(
      "Debug - Final result - offers:",
      offers.length,
      "accepted:",
      accepted.length
    );

    return {
      success: true,
      data: {
        offers,
        acceptedGigs: accepted,
      },
    };
  } catch (error: unknown) {
    console.error("Error fetching worker offers:", error);
    return {
       error: error instanceof Error ? error.message : "Failed to fetch worker offers",
      status: 500,
    };
  }
}
