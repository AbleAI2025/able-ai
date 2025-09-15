"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNull, or } from "drizzle-orm";
import { GigsTable, GigWorkerProfilesTable, UsersTable, gigStatusEnum } from "@/lib/drizzle/schema";
import moment from "moment";
import GigDetails from "@/app/types/GigDetailsTypes";

// Constants for worker statistics calculation
const MAX_EXPERIENCE_YEARS = 10;
const MIN_GIGS_FOR_STAR_WORKER = 5;

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
    if (obj.administrative_area_level_1) parts.push(obj.administrative_area_level_1);
    if (obj.postal_code) parts.push(obj.postal_code);
    if (obj.country) parts.push(obj.country);
    
    if (parts.length > 0) {
      return parts.join(', ');
    }
  }
  
  // Only use coordinates as a last resort if no readable address is available
  if (obj.lat && obj.lng && typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    return `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
  }
  
  return null;
}

// Helper function to extract location from a string
function extractLocationFromString(str: string): string | null {
  if (!str || typeof str !== 'string') return null;
  
  // Check if it's a URL first
  if (str.startsWith('http')) {
    return `Map Link: ${str}`;
  }
  
  // Check if it's already a formatted location string (prioritize readable text)
  if (str.includes(',') && !str.includes('[object Object]') && !str.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
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
  
  if (typeof data === 'string') {
    return extractLocationFromString(data);
  }
  
  if (typeof data === 'object') {
    return extractLocationFromObject(data);
  }
  
  return null;
}

// Helper function to perform aggressive location extraction from an object
function extractLocationAggressively(obj: any): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
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
    if (typeof value === 'string' && value.trim() && 
        value !== 'null' && value !== 'undefined' && value !== '[object Object]' && 
        !value.includes('[object Object]') && !value.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
      return value.trim();
    }
  }
  
  // Only use coordinates as absolute last resort
  if (obj.lat && obj.lng) {
    return `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
  }
  
  return null;
}

// Helper function to parse location from gig data
function parseGigLocation(gig: any): string {
  // Try to extract location from addressJson first (prioritize formatted addresses)
  if (gig.addressJson) {
    if (typeof gig.addressJson === 'string') {
      try {
        const parsed = JSON.parse(gig.addressJson);
        const extracted = extractLocationFromObject(parsed);
        if (extracted) {
          return extracted;
        }
      } catch (e) {
        // If JSON parsing fails, try as string
        const extracted = extractLocationFromString(gig.addressJson);
        if (extracted) {
          return extracted;
        }
      }
    } else if (typeof gig.addressJson === 'object') {
      const extracted = extractLocationFromObject(gig.addressJson);
      if (extracted) {
        return extracted;
      }
    }
  }
  
  // If addressJson didn't work, try exactLocation
  if (gig.exactLocation) {
    const extracted = extractLocationFromData(gig.exactLocation);
    if (extracted) {
      return extracted;
    }
  }

  // If still no location, try aggressive extraction
  if (gig.addressJson && typeof gig.addressJson === 'object') {
    const extracted = extractLocationAggressively(gig.addressJson);
    if (extracted) {
      return extracted;
    }
  }
  
  if (gig.exactLocation && typeof gig.exactLocation === 'object') {
    const extracted = extractLocationAggressively(gig.exactLocation);
    if (extracted) {
      return extracted;
    }
  }

  // Return fallback location if no valid location found
  return 'Location details available';
}

export async function getGigDetails({
  gigId,
  userId,
  role,
  isDatabaseUserId = false,
}: { 
  gigId: string; 
  userId: string; 
  role?: 'buyer' | 'worker'; 
  isViewQA?: boolean;
  isDatabaseUserId?: boolean;
}) {

  
  if (!userId) {
    console.log('🔍 DEBUG: No userId provided');
    return { error: 'User id is required', gig: {} as GigDetails, status: 404 };
  }

  try {
    let user;
    
    if (isDatabaseUserId) {
      // Look up by database user ID directly
      console.log('🔍 DEBUG: Looking up user with database user ID:', userId);
      user = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, userId),
        columns: {
          id: true,
          firebaseUid: true,
          fullName: true,
        }
      });
    } else {
      // Look up by Firebase UID (original behavior)
      console.log('🔍 DEBUG: Looking up user with Firebase UID:', userId);
      user = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.firebaseUid, userId),
        columns: {
          id: true,
          firebaseUid: true,
          fullName: true,
        }
      });
    }

    console.log('🔍 DEBUG: User lookup result:', { 
      found: !!user, 
      userId: user?.id, 
      firebaseUid: user?.firebaseUid,
      fullName: user?.fullName,
      searchedFor: userId,
      isDatabaseUserId
    });

    console.log('🔍 DEBUG: User lookup result:', { found: !!user, userId: user?.id });

    if (!user) {
      console.log('🔍 DEBUG: User not found in database for ID:', userId);
      return { error: 'User is not found', gig: {} as GigDetails, status: 404 };
    }

    let gig;
    
    if (role === 'buyer') {
      // For buyers, only show gigs they created
      gig = await db.query.GigsTable.findFirst({
        where: and(eq(GigsTable.buyerUserId, user.id), eq(GigsTable.id, gigId)),
        with: {
          buyer: {
            columns: {
              id: true,
              fullName: true,
              email: true,
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
    } else if (role === 'worker') {
      // For workers, show both assigned gigs and available offers
      console.log('🔍 DEBUG: Querying gig for worker with user ID:', user.id);
      gig = await db.query.GigsTable.findFirst({
        where: and(
          eq(GigsTable.id, gigId),
          or(
            // Assigned gigs
            eq(GigsTable.workerUserId, user.id),
            // Available offers (PENDING_WORKER_ACCEPTANCE status with no assigned worker)
            and(
              eq(GigsTable.statusInternal, gigStatusEnum.enumValues[0]), // PENDING_WORKER_ACCEPTANCE
              isNull(GigsTable.workerUserId)
            )
          )
        ),
        with: {
          buyer: {
            columns: {
              id: true,
              fullName: true,
              email: true,
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
      console.log('🔍 DEBUG: Gig query result for worker:', { found: !!gig, gigId: gig?.id });
    } else {
      // Fallback to original logic for other roles
      const columnConditionId = role === 'buyer' ? GigsTable.buyerUserId : GigsTable.workerUserId;
      gig = await db.query.GigsTable.findFirst({
        where: and(eq(columnConditionId, user.id), eq(GigsTable.id, gigId)),
        with: {
          buyer: {
            columns: {
              id: true,
              fullName: true,
              email: true,
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

    const worker = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, gig?.worker?.id || ""),
    })

    if (!gig) {
      console.log('🔍 DEBUG: Gig not found in database');
      return { error: 'gig not found', gig: {} as GigDetails, status: 404 };
    }

    const startDate = moment(gig.startTime);
    const endDate = moment(gig.endTime);
    const durationInHours = endDate.diff(startDate, 'hours', true);
    const estimatedEarnings = gig.totalAgreedPrice ? parseFloat(gig.totalAgreedPrice) : 0;
    const hourlyRate = gig.agreedRate ? parseFloat(gig.agreedRate) : 0;
    const isWorkerSubmittedFeedback = false;
    const isBuyerSubmittedFeedback = false;

    // Parse location using helper function
    const roleDisplay = gig.titleInternal || 'Gig Worker';

    // Calculate worker statistics if there's an assigned worker
    let workerGigs = 0;
    let workerExperience = 0;
    let isWorkerStar = false;

    if (gig.worker?.id) {
      // Get completed gigs count for the worker in a separate optimized query
      // This is more efficient than including it in the main query due to the complexity
      const completedGigs = await db.query.GigsTable.findMany({
        where: and(
          eq(GigsTable.workerUserId, gig.worker.id),
          eq(GigsTable.statusInternal, 'COMPLETED')
        ),
        columns: { id: true }
      });
      workerGigs = completedGigs.length;

      // Calculate experience based on completed gigs (rough estimate)
      // Assuming each gig represents some experience
      workerExperience = Math.min(workerGigs, MAX_EXPERIENCE_YEARS);

      // Determine if worker is a star (simplified logic)
      isWorkerStar = workerGigs >= MIN_GIGS_FOR_STAR_WORKER;
    }

    const gigDetails: GigDetails = {
      id: gig.id,
      role: roleDisplay,
      gigTitle: gig.titleInternal || 'Untitled Gig',
      buyerName: gig.buyer?.fullName || 'Unknown',
      date: startDate.format('YYYY-MM-DD'),
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
      hiringManager: gig.buyer?.fullName || 'Manager',
      hiringManagerUsername: gig.buyer?.email || 'No email',
      isWorkerSubmittedFeedback: isWorkerSubmittedFeedback,
      isBuyerSubmittedFeedback: isBuyerSubmittedFeedback,
      // Worker-related properties
      workerName: gig.worker?.fullName || undefined,
      workerAvatarUrl: undefined, // TODO: Implement proper profile image URL retrieval from Firebase
      workerGigs: workerGigs,
      workerExperience: workerExperience,
      isWorkerStar: isWorkerStar,
    };

    return { success: true, gig: gigDetails, status: 200 };

  } catch (error: unknown) {
    console.error("Error fetching gig:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error fetching gig', gig: {} as GigDetails, status: 500 };
  }
}
