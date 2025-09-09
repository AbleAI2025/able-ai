"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, or, isNull } from "drizzle-orm"; // Added 'or' and 'isNull' for the merged query logic
import { GigsTable, UsersTable } from "@/lib/drizzle/schema";
import moment from "moment";
import GigDetails from "@/app/types/GigDetailsTypes";

function getMockedQAData(gigId: string) {
  if (gigId === "gig123-accepted") {
    return {
      id: "gig123-accepted",
      workerId: "mock-worker-id-1",
      role: "Lead Bartender",
      gigTitle: "Corporate Mixer Event",
      buyerName: "Innovate Solutions Ltd.", buyerAvatarUrl: "/images/logo-placeholder.svg",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      location: "123 Business Rd, Tech Park, London, EC1A 1BB",
      hourlyRate: 25,
      estimatedEarnings: 125,
      specialInstructions: "Focus on high-quality cocktails. Dress code: smart black. Setup starts 30 mins prior. Contact person on site: Jane (07xxxxxxxxx).",
      status: "ACCEPTED",
      statusInternal: "IN_PROGRESS",
      hiringManager: "Jane Smith",
      hiringManagerUsername: "@janesmith",
      isBuyerSubmittedFeedback: false,
      isWorkerSubmittedFeedback: true,
    } as GigDetails;
  }
  if (gigId === "gig456-inprogress") {
    return {
      id: "gig4s56-inprogress",
      workerId: "mock-worker-id-2",
      role: "Event Server",
      gigTitle: "Wedding Reception",
      buyerName: "Alice & Bob",
      date: new Date().toISOString(),
      startTime: new Date(new Date().setHours(16, 0, 0, 0)).toISOString(),
      endTime: new Date(new Date().setHours(22, 0, 0, 0)).toISOString(),
      location: "The Manor House, Countryside Lane, GU21 5ZZ",
      hourlyRate: 18, estimatedEarnings: 108,
      specialInstructions: "Silver service required. Liaise with the event coordinator Sarah upon arrival.",
      status: "ACCEPTED",
      statusInternal: "IN_PROGRESS",
      hiringManager: "Sarah Johnson",
      hiringManagerUsername: "@sarahjohnson",
      isBuyerSubmittedFeedback: false,
      isWorkerSubmittedFeedback: true,
    } as GigDetails;
  }

  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    id: gigId,
    role: "Bartender",
    gigTitle: "Pop-up Bar Night",
    buyerName: "John Doe",
    date: start.toISOString(),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    duration: "2 hours",
    location: "221B Baker Street, London",
    hourlyRate: 20,
    estimatedEarnings: 40,
    specialInstructions: "Arrive 20 mins early for setup.",
    status: "PENDING",
    statusInternal: "PENDING_WORKER_ACCEPTANCE",
    hiringManager: "Alex Doe",
    hiringManagerUsername: "@alexd",
    isBuyerSubmittedFeedback: false,
    isWorkerSubmittedFeedback: false,
  } as GigDetails;
}

function getMappedStatus(internalStatus: string): GigDetails['status'] {
  switch (internalStatus) {
    case 'PENDING_WORKER_ACCEPTANCE':
      return 'PENDING';
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED_BY_BUYER':
    case 'CANCELLED_BY_WORKER':
    case 'CANCELLED_BY_ADMIN':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }
}

// Helper function to extract location from an object
function extractLocationFromObject(obj: any): string | null {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return null;

  if (obj.lat && obj.lng && typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    return `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
  }
  if (obj.formatted_address) {
    return obj.formatted_address;
  }
  if (obj.address) {
    return obj.address;
  }
  const parts = [obj.street_number, obj.route, obj.locality, obj.administrative_area_level_1, obj.postal_code, obj.country].filter(Boolean);
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return null;
}

// Helper function to extract location from a string
function extractLocationFromString(str: string): string | null {
  if (!str || typeof str !== 'string' || str.includes('[object Object]')) return null;
  if (str.includes(',')) {
    return str;
  }
  if (str.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
    return `Coordinates: ${str}`;
  }
  if (str.startsWith('http')) {
    return `Map Link: ${str}`;
  }
  return null;
}

// Helper function to parse location from gig data
function parseGigLocation(gig: any): string {
  let locationDisplay: string | null = null;

  // Try to extract location from exactLocation first
  if (gig.exactLocation) {
    if (typeof gig.exactLocation === 'string') {
      locationDisplay = extractLocationFromString(gig.exactLocation);
    } else if (typeof gig.exactLocation === 'object') {
      locationDisplay = extractLocationFromObject(gig.exactLocation);
    }
  }

  // If exactLocation didn't work, try addressJson
  if (!locationDisplay && gig.addressJson) {
    if (typeof gig.addressJson === 'string') {
      try {
        const parsed = JSON.parse(gig.addressJson);
        locationDisplay = extractLocationFromObject(parsed);
      } catch (e) {
        locationDisplay = extractLocationFromString(gig.addressJson);
      }
    } else if (typeof gig.addressJson === 'object') {
      locationDisplay = extractLocationFromObject(gig.addressJson);
    }
  }

  // Final validation and fallback
  if (!locationDisplay || locationDisplay.includes('[object Object]')) {
    locationDisplay = 'Location details available';
  }

  return locationDisplay;
}

export async function getGigDetails({
  gigId,
  userId,
  role,
  isViewQA
}: {
  gigId: string;
  userId: string;
  role?: 'buyer' | 'worker';
  isViewQA?: boolean;
}) {
  if (!userId) {
    return { error: 'User id is required', gig: {} as GigDetails, status: 404 };
  }

  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true }
    });

    if (!user) {
      return { error: 'User is not found', gig: {} as GigDetails, status: 404 };
    }

    let gig;

    // Using the more detailed query logic to handle different roles correctly
    if (role === 'buyer') {
      gig = await db.query.GigsTable.findFirst({
        where: and(eq(GigsTable.buyerUserId, user.id), eq(GigsTable.id, gigId)),
        with: {
          buyer: { columns: { id: true, fullName: true, email: true } },
          worker: { columns: { id: true, fullName: true } },
        },
      });
    } else if (role === 'worker') {
      gig = await db.query.GigsTable.findFirst({
        where: and(
          eq(GigsTable.id, gigId),
          or(
            eq(GigsTable.workerUserId, user.id),
            // Allows workers to see gigs that are pending and not yet assigned
            and(
              eq(GigsTable.statusInternal, 'PENDING_WORKER_ACCEPTANCE'),
              isNull(GigsTable.workerUserId)
            )
          )
        ),
        with: {
          buyer: { columns: { id: true, fullName: true, email: true } },
          worker: { columns: { id: true, fullName: true } },
        },
      });
    } else {
      // Fallback logic
      const columnConditionId = GigsTable.workerUserId;
      gig = await db.query.GigsTable.findFirst({
        where: and(eq(columnConditionId, user.id), eq(GigsTable.id, gigId)),
        with: {
          buyer: { columns: { id: true, fullName: true, email: true } },
          worker: { columns: { id: true, fullName: true } },
        },
      });
    }

    if (isViewQA && !gig) return { gig: getMockedQAData(gigId) as GigDetails, status: 200 };

    if (!gig) {
      return { error: 'gig not found', gig: {} as GigDetails, status: 404 };
    }
    
    console.log('Gig debug - raw gig object:', JSON.stringify(gig, null, 2));

    const startDate = moment(gig.startTime);
    const endDate = moment(gig.endTime);
    const durationInHours = endDate.diff(startDate, 'hours', true);
    const estimatedEarnings = gig.totalAgreedPrice ? parseFloat(gig.totalAgreedPrice) : 0;
    const hourlyRate = gig.agreedRate ? parseFloat(gig.agreedRate) : 0;
    const isWorkerSubmittedFeedback = false;
    const isBuyerSubmittedFeedback = false;

    // Using the robust location parsing helper function
    const locationDisplay = parseGigLocation(gig);
    const roleDisplay = gig.titleInternal || 'Gig Worker';

    const gigDetails: GigDetails = {
      id: gig.id,
      workerId: gig.workerUserId || undefined,
      role: roleDisplay,
      gigTitle: gig.titleInternal || 'Untitled Gig',
      buyerName: gig.buyer?.fullName || 'Unknown',
      date: startDate.format('YYYY-MM-DD'),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: `${durationInHours.toFixed(1)} hours`,
      location: locationDisplay,
      hourlyRate: hourlyRate,
      estimatedEarnings: estimatedEarnings,
      specialInstructions: gig.notesForWorker || undefined,
      status: getMappedStatus(gig.statusInternal),
      statusInternal: gig.statusInternal,
      hiringManager: gig.buyer?.fullName || 'Manager',
      hiringManagerUsername: gig.buyer?.email || 'No email',
      isWorkerSubmittedFeedback: isWorkerSubmittedFeedback,
      isBuyerSubmittedFeedback: isBuyerSubmittedFeedback,
    };

    return { gig: gigDetails, status: 200 };

  } catch (error: unknown) {
    console.error("Error fetching gig:", error);
    return { error: error instanceof Error ? error.message : 'Unknown error fetching gig', gig: {} as GigDetails, status: 500 };
  }
}
