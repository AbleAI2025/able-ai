"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, UsersTable } from "@/lib/drizzle/schema";
import moment from "moment";
import GigDetails from "@/app/types/GigDetailsTypes";

function getMockedQAData(gigId: string) {
  // Example Data (should match the actual GigDetails interface)

  if (gigId === "gig123-accepted") {
    return {
      id: "gig123-accepted",
      role: "Lead Bartender",
      gigTitle: "Corporate Mixer Event",
      buyerName: "Innovate Solutions Ltd.", buyerAvatarUrl: "/images/logo-placeholder.svg",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // In 2 days
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
      id: "gig456-inprogress",
      role: "Event Server",
      gigTitle: "Wedding Reception",
      buyerName: "Alice & Bob",
      date: new Date().toISOString(), // Today
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

  // Fallback generic mock for any other gigId in QA mode
  const now = new Date();
  const start = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
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
  
  console.log('Location debug - extracting from object:', obj);
  
  // Handle coordinate objects with lat/lng
  if (obj.lat && obj.lng && typeof obj.lat === 'number' && typeof obj.lng === 'number') {
    const result = `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
    console.log('Location debug - extracted coordinates:', result);
    return result;
  }
  
  // Handle address objects
  if (obj.formatted_address) {
    const result = obj.formatted_address;
    console.log('Location debug - extracted formatted_address:', result);
    return result;
  }
  
  // Handle other address fields
  if (obj.address) {
    const result = obj.address;
    console.log('Location debug - extracted address:', result);
    return result;
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
      const result = parts.join(', ');
      console.log('Location debug - extracted address components:', result);
      return result;
    }
  }
  
  console.log('Location debug - no meaningful data found in object');
  return null;
}
// Helper function to extract location from a string
function extractLocationFromString(str: string): string | null {
  if (!str || typeof str !== 'string') return null;
  console.log('Location debug - processing string:', str);
  // Check if it's already a formatted location string
  if (str.includes(',') && !str.includes('[object Object]')) {
    console.log('Location debug - using string as-is:', str);
    return str;
  }
  
  // Check if it's coordinates
  if (str.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
    const result = `Coordinates: ${str}`;
    console.log('Location debug - formatted coordinates:', result);
    return result;
  }
  
  // Check if it's a URL
  if (str.startsWith('http')) {
    const result = `Map Link: ${str}`;
    console.log('Location debug - formatted URL:', result);
    return result;
  }
  
  console.log('Location debug - string not recognized as location');
  return null;
}

// Helper function to parse location from gig data
function parseGigLocation(gig: any): string {
  let locationDisplay = 'Location not specified';
  
  console.log('Location debug - exactLocation:', gig.exactLocation);
  console.log('Location debug - addressJson:', gig.addressJson);
  console.log('Location debug - exactLocation type:', typeof gig.exactLocation);
  console.log('Location debug - addressJson type:', typeof gig.addressJson);
  
  // Try to extract location from exactLocation first
  if (gig.exactLocation) {
    console.log('Location debug - processing exactLocation:', gig.exactLocation);
    if (typeof gig.exactLocation === 'string') {
      const extracted = extractLocationFromString(gig.exactLocation);
      if (extracted) {
        locationDisplay = extracted;
        console.log('Location debug - using exactLocation string:', locationDisplay);
      }
    } else if (typeof gig.exactLocation === 'object') {
      const extracted = extractLocationFromObject(gig.exactLocation);
      if (extracted) {
        locationDisplay = extracted;
        console.log('Location debug - using exactLocation object:', locationDisplay);
      }
    }
  }
  
  // If exactLocation didn't work, try addressJson
  if (locationDisplay === 'Location not specified' && gig.addressJson) {
    console.log('Location debug - processing addressJson:', gig.addressJson);
    if (typeof gig.addressJson === 'string') {
      try {
        const parsed = JSON.parse(gig.addressJson);
        const extracted = extractLocationFromObject(parsed);
        if (extracted) {
          locationDisplay = extracted;
          console.log('Location debug - using parsed addressJson:', locationDisplay);
        }
      } catch (e) {
        console.log('Location debug - addressJson parsing failed, trying as string');
        const extracted = extractLocationFromString(gig.addressJson);
        if (extracted) {
          locationDisplay = extracted;
          console.log('Location debug - using addressJson as string:', locationDisplay);
        }
      }
    } else if (typeof gig.addressJson === 'object') {
      const extracted = extractLocationFromObject(gig.addressJson);
      if (extracted) {
        locationDisplay = extracted;
        console.log('Location debug - using addressJson object:', locationDisplay);
      }
    }
  }

    // If still no location, try one more aggressive pass
    if (locationDisplay === 'Location not specified') {
      // Try addressJson again with more aggressive parsing
      if (gig.addressJson && typeof gig.addressJson === 'object') {
        const obj = gig.addressJson as any;
        
        if (obj.lat && obj.lng) {
          locationDisplay = `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
        } else if (obj.formatted_address) {
          locationDisplay = obj.formatted_address;
        } else if (obj.address) {
          locationDisplay = obj.address;
        } else if (obj.street && obj.city) {
          locationDisplay = `${obj.street}, ${obj.city}`;
        } else {
          // Show any available string data
          for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string' && value.trim() && 
                value !== 'null' && value !== 'undefined' && value !== '[object Object]' && !value.includes('[object Object]')) {
              locationDisplay = value.trim();
              break;
            }
          }
        }
      }
      
      // Try exactLocation one more time
      if (locationDisplay === 'Location not specified' && gig.exactLocation && typeof gig.exactLocation === 'object') {
        const obj = gig.exactLocation as any;
        
        if (obj.lat && obj.lng) {
          locationDisplay = `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
        } else if (obj.formatted_address) {
          locationDisplay = obj.formatted_address;
        }
      }
    }
  // Final aggressive extraction attempt
  if (locationDisplay === 'Location not specified') {
    console.log('Location debug - attempting final aggressive extraction');
    
    if (gig.addressJson && typeof gig.addressJson === 'object') {
      const obj = gig.addressJson as any;
      console.log('Location debug - final addressJson object:', obj);
      
      if (obj.lat && obj.lng) {
        locationDisplay = `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
      } else if (obj.formatted_address) {
        locationDisplay = obj.formatted_address;
      } else if (obj.address) {
        locationDisplay = obj.address;
      } else if (obj.street && obj.city) {
        locationDisplay = `${obj.street}, ${obj.city}`;
      } else {
        // Show any available string data
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string' && value.trim() && 
              value !== 'null' && value !== 'undefined' && value !== '[object Object]' && !value.includes('[object Object]')) {
            locationDisplay = value.trim();
            console.log('Location debug - final extraction from key:', key, 'value:', locationDisplay);
            break;
          }
        }
      }
    }
    
    if (locationDisplay === 'Location not specified' && gig.exactLocation && typeof gig.exactLocation === 'object') {
      const obj = gig.exactLocation as any;
      console.log('Location debug - final exactLocation object:', obj);
      
      if (obj.lat && obj.lng) {
        locationDisplay = `Coordinates: ${obj.lat.toFixed(6)}, ${obj.lng.toFixed(6)}`;
      } else if (obj.formatted_address) {
        locationDisplay = obj.formatted_address;
      }
    }
  }

    // Final validation: ensure we never return problematic values
    if (locationDisplay === '[object Object]' || locationDisplay.includes('[object Object]')) {
      locationDisplay = 'Location not specified';
    }
  // Final validation and fallback
  if (locationDisplay === '[object Object]' || locationDisplay.includes('[object Object]')) {
    console.warn('Location debug - caught problematic location value, clearing it');
    locationDisplay = 'Location not specified';
  }

    // Additional safety check - ensure we always have a meaningful location
    if (locationDisplay === 'Location not specified') {
      locationDisplay = 'Location details available';
    }

    // Use the full titleInternal as the role (no truncation)
  if (locationDisplay === 'Location not specified') {
    console.log('Location debug - no location found, using fallback');
    locationDisplay = 'Location details available';
  }

  console.log('Location debug - FINAL locationDisplay:', locationDisplay);
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
      columns: {
        id: true,
      }
    });

    if (!user) {
      return { error: 'User is not found', gig: {} as GigDetails, status: 404 };
    }

    const columnConditionId = role === 'buyer' ? GigsTable.buyerUserId : GigsTable.workerUserId;
    const gig = await db.query.GigsTable.findFirst({
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

    // Parse location using helper function
    const locationDisplay = parseGigLocation(gig);
    const roleDisplay = gig.titleInternal || 'Gig Worker';

    const gigDetails: GigDetails = {
      id: gig.id,
      role: roleDisplay,
      gigTitle: gig.titleInternal || 'Untitled Gig',
      buyerName: gig.buyer?.fullName || 'Unknown',
      date: startDate.format('YYYY-MM-DD'),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: `${durationInHours} hours`,
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