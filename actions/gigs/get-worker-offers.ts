"use server";

import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import { gigStatusEnum, UsersTable, GigsTable, GigWorkerProfilesTable } from "@/lib/drizzle/schema";
import { isWorkerWithinDistance, parseCoordinates, calculateDistance } from "@/lib/utils/distance";

// Constants
const DEFAULT_GIG_SEARCH_RADIUS_KM = 30;

// Gig statuses for offers (pending worker acceptance)
const PENDING_WORKER_ACCEPTANCE = 'PENDING_WORKER_ACCEPTANCE';

// Gig statuses for accepted gigs
const ACCEPTED = 'ACCEPTED';
const IN_PROGRESS = 'IN_PROGRESS';
const PENDING_COMPLETION_WORKER = 'PENDING_COMPLETION_WORKER';
const PENDING_COMPLETION_BUYER = 'PENDING_COMPLETION_BUYER';
const COMPLETED = 'COMPLETED';
const AWAITING_PAYMENT = 'AWAITING_PAYMENT';
const PAID = 'PAID';

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
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
      with: {
        gigWorkerProfile: {
          columns: { 
            location: true,
            latitude: true,
            longitude: true
          }
        }
      }
    });

    if (!user) {
      return { error: "User not found", status: 404 };
    }

    // Get worker's location for distance filtering
    const workerProfile = user.gigWorkerProfile;
    let workerCoords = null;
    
    // Try to get coordinates from latitude/longitude fields first
    if (workerProfile?.latitude && workerProfile?.longitude) {
      const lat = parseFloat(workerProfile.latitude.toString());
      const lng = parseFloat(workerProfile.longitude.toString());
      if (!isNaN(lat) && !isNaN(lng)) {
        workerCoords = { lat, lon: lng };
        console.log(`🔍 DEBUG: Worker coordinates from lat/lng: ${lat}, ${lng}`);
      }
    }
    
    // Fallback to parsing location string
    if (!workerCoords && workerProfile?.location) {
      workerCoords = parseCoordinates(workerProfile.location);
      console.log(`🔍 DEBUG: Worker coordinates from location string:`, workerCoords);
    }
    
    console.log(`🔍 DEBUG: Final worker coordinates:`, workerCoords);

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

    const offerGigs = allGigs.filter(
      (gig) => {
        const basicFilter = gig.statusInternal === PENDING_WORKER_ACCEPTANCE &&
          !gig.workerUserId &&
          gig.buyerUserId !== user.id;
        
        if (!basicFilter) return false;
        
        // If worker has coordinates, filter by distance
        if (workerCoords) {
          const gigLocation = gig.exactLocation || gig.addressJson;
          const gigCoords = parseCoordinates(gigLocation);
          
          if (gigCoords) {
            const distance = calculateDistance(
              workerCoords.lat,
              workerCoords.lon,
              gigCoords.lat,
              gigCoords.lon
            );
            
            const withinRange = distance <= DEFAULT_GIG_SEARCH_RADIUS_KM;
            console.log(`🔍 DEBUG: Gig ${gig.id} - Distance: ${distance.toFixed(2)}km, Within range: ${withinRange}`);
            return withinRange;
          } else {
            console.log(`🔍 DEBUG: Gig ${gig.id} - No valid gig coordinates, including anyway`);
            return true; // Include gigs without coordinates
          }
        }
        
        // If no worker coordinates, include all gigs (fallback)
        console.log(`🔍 DEBUG: No worker coordinates, including all gigs`);
        return true;
      }
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
