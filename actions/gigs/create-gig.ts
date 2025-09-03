"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, UsersTable, gigStatusEnum, moderationStatusEnum } from "@/lib/drizzle/schema";

type CreateGigInput = {
  userId: string; // Firebase UID
  gigDescription: string;
  additionalInstructions?: string;
  hourlyRate: number | string;
  gigLocation?: string | { lat?: number; lng?: number; formatted_address?: string; address?: string; [key: string]: any };
  gigDate: string; // YYYY-MM-DD
  gigTime?: string; // HH:mm (24h) or time range like "12:00-14:30"
  discountCode?: string;
};

type CreateGigResult = {
  status: number;
  gigId?: string;
  error?: string;
};

function coerceNumber(value: number | string | undefined, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  const num = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(num) ? num : fallback;
}

function buildDateTime(gigDate: string, gigTime?: string): { startTime: Date; endTime: Date; duration: number } {
  console.log('buildDateTime debug - gigDate:', gigDate, 'gigTime:', gigTime);
  
  // Check if gigTime is a time range with " to " (AI formatted)
  if (gigTime && gigTime.includes(' to ')) {
    const timeRangeMatch = gigTime.match(/^(\d{1,2}):(\d{2})\s*to\s*(\d{1,2}):(\d{2})$/);
    if (timeRangeMatch) {
      const startHours = parseInt(timeRangeMatch[1], 10);
      const startMinutes = parseInt(timeRangeMatch[2], 10);
      const endHours = parseInt(timeRangeMatch[3], 10);
      const endMinutes = parseInt(timeRangeMatch[4], 10);
      
      const startTime = new Date(`${gigDate}T${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`);
      const endTime = new Date(`${gigDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`);
      
      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const duration = durationMs / (1000 * 60 * 60);
      
      console.log('buildDateTime debug - parsed time range:', { startTime, endTime, duration });
      return { startTime, endTime, duration };
    }
  }
  
  // Check if gigTime is a time range with dash (e.g., "12:00-14:30")
  if (gigTime && gigTime.includes('-')) {
    const timeRangeMatch = gigTime.match(/^(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/);
    if (timeRangeMatch) {
      const startHours = parseInt(timeRangeMatch[1], 10);
      const startMinutes = parseInt(timeRangeMatch[2], 10);
      const endHours = parseInt(timeRangeMatch[3], 10);
      const endMinutes = parseInt(timeRangeMatch[4], 10);
      
      const startTime = new Date(`${gigDate}T${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}:00`);
      const endTime = new Date(`${gigDate}T${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}:00`);
      
      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const duration = durationMs / (1000 * 60 * 60);
      
      console.log('buildDateTime debug - parsed dash time range:', { startTime, endTime, duration });
      return { startTime, endTime, duration };
    }
  }
  
  // Handle single time in 24-hour format (e.g., "14:30")
  if (gigTime && /^\d{1,2}:\d{2}$/.test(gigTime)) {
    const time = gigTime;
    const startTime = new Date(`${gigDate}T${time}:00`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // default 2h
    const duration = 2; // default 2 hours
    
    console.log('buildDateTime debug - parsed single time:', { startTime, endTime, duration });
    return { startTime, endTime, duration };
  }
  
  // Fallback to default time
  console.log('buildDateTime debug - using default time 09:00-11:00');
  const startTime = new Date(`${gigDate}T09:00:00`);
  const endTime = new Date(`${gigDate}T11:00:00`);
  const duration = 2; // default 2 hours
  
  return { startTime, endTime, duration };
}

export async function createGig(input: CreateGigInput): Promise<CreateGigResult> {
  try {
    const { userId, gigDescription, additionalInstructions, hourlyRate, gigLocation, gigDate, gigTime } = input;

    if (!userId) return { status: 400, error: "Missing userId" };
    if (!gigDescription) return { status: 400, error: "Missing gigDescription" };
    if (!gigDate) return { status: 400, error: "Missing gigDate" };

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { status: 404, error: "User not found" };

    const { startTime, endTime, duration } = buildDateTime(gigDate, gigTime);
    const rate = coerceNumber(hourlyRate, 0);

    // Process location data to store coordinates in addressJson and readable text in exactLocation
    let processedLocation: string | null = null;
    let addressJsonData: any = null;

    if (gigLocation) {
      console.log('Create gig debug - received gigLocation:', gigLocation);
      console.log('Create gig debug - gigLocation type:', typeof gigLocation);
      
      if (typeof gigLocation === 'object' && gigLocation !== null) {
        const locationObj = gigLocation as any;
        console.log('Create gig debug - processing location object:', locationObj);
        
        // Store the full object in addressJson for future reference
        addressJsonData = locationObj;
        
        // Extract the most useful display format for exactLocation
        if (locationObj.lat && locationObj.lng && typeof locationObj.lat === 'number' && typeof locationObj.lng === 'number') {
          // Priority 1: Coordinates (most precise) - store in addressJson, show readable format
          processedLocation = `Coordinates: ${locationObj.lat.toFixed(6)}, ${locationObj.lng.toFixed(6)}`;
          console.log('Create gig debug - extracted coordinates:', processedLocation);
        } else if (locationObj.formatted_address) {
          // Priority 2: Formatted address
          processedLocation = locationObj.formatted_address;
          console.log('Create gig debug - extracted formatted_address:', processedLocation);
        } else if (locationObj.address) {
          // Priority 3: Address field
          processedLocation = locationObj.address;
          console.log('Create gig debug - extracted address:', processedLocation);
        } else {
          // Priority 4: Build from components
          const parts = [];
          if (locationObj.street_number) parts.push(locationObj.street_number);
          if (locationObj.route) parts.push(locationObj.route);
          if (locationObj.locality) parts.push(locationObj.locality);
          if (locationObj.administrative_area_level_1) parts.push(locationObj.administrative_area_level_1);
          if (locationObj.postal_code) parts.push(locationObj.postal_code);
          if (locationObj.country) parts.push(locationObj.country);
          
          if (parts.length > 0) {
            processedLocation = parts.join(', ');
            console.log('Create gig debug - built address from components:', processedLocation);
          }
        }
      } else if (typeof gigLocation === 'string') {
        console.log('Create gig debug - processing location string:', gigLocation);
        
        // Check if it's already a formatted location string
        if (gigLocation.includes(',') && !gigLocation.includes('[object Object]')) {
          processedLocation = gigLocation;
          console.log('Create gig debug - using string as-is:', processedLocation);
        } else if (gigLocation.match(/^-?\d+\.\d+,\s*-?\d+\.\d+$/)) {
          // It's coordinates, format them nicely
          processedLocation = `Coordinates: ${gigLocation}`;
          console.log('Create gig debug - formatted coordinates:', processedLocation);
        } else if (gigLocation.startsWith('http')) {
          // It's a URL, store as-is
          processedLocation = gigLocation;
          console.log('Create gig debug - using URL as-is:', processedLocation);
        } else {
          // Generic string, use as-is
          processedLocation = gigLocation;
          console.log('Create gig debug - using generic string:', processedLocation);
        }
      }
      
      console.log('Create gig debug - final processedLocation:', processedLocation);
      console.log('Create gig debug - final addressJsonData:', addressJsonData);
    } else {
      console.log('Create gig debug - no gigLocation provided');
    }

    // Ensure we never store problematic values
    if (processedLocation === '[object Object]' || processedLocation?.includes('[object Object]')) {
      console.warn('CreateGig warning - caught problematic location value, using fallback');
      processedLocation = 'Location coordinates or address available';
    }

    // Additional safety check - ensure we always have a valid location string
    if (!processedLocation || processedLocation.trim() === '') {
      processedLocation = 'Location details provided';
    }

    console.log('CreateGig debug - original gigLocation:', gigLocation);
    console.log('CreateGig debug - processed location:', processedLocation);
    console.log('CreateGig debug - addressJson data:', addressJsonData);

    const insertData = {
      buyerUserId: user.id,
      titleInternal: gigDescription.slice(0, 255),
      fullDescription: additionalInstructions || null,
      exactLocation: processedLocation,
      addressJson: addressJsonData,
      startTime,
      endTime,
      agreedRate: rate.toString(), // Convert to string as expected by the schema
      estimatedHours: duration.toString(), // Convert to string as expected by the schema
      // Explicit status values to avoid NULL constraint violations
      statusInternal: gigStatusEnum.enumValues[0],
      moderationStatus: moderationStatusEnum.enumValues[0],
      // Leave totals/fees null for now; can be computed later
    };

    console.log('CreateGig debug - insert data:', insertData);

    const [inserted] = await db
      .insert(GigsTable)
      .values(insertData)
      .returning({ id: GigsTable.id });

    if (!inserted?.id) return { status: 500, error: "Failed to create gig" };

    return { status: 200, gigId: inserted.id };
  } catch (error: any) {
    console.error("Error creating gig:", error);
    return { status: 500, error: error?.message || "Unknown error" };
  }
}


