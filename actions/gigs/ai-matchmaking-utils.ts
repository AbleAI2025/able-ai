// Helper function to calculate distance between two coordinates in kilometers
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to extract coordinates from location string
export function extractCoordinates(location: string): { lat: number; lng: number } | null {
  // Handle "Coordinates: lat, lng" format
  const coordMatch = location.match(/Coordinates:\s*([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)/);
  if (coordMatch) {
    return {
      lat: parseFloat(coordMatch[1]),
      lng: parseFloat(coordMatch[2])
    };
  }

  // Handle other coordinate formats if needed
  const directMatch = location.match(/([+-]?\d+\.?\d*),\s*([+-]?\d+\.?\d*)/);
  if (directMatch) {
    return {
      lat: parseFloat(directMatch[1]),
      lng: parseFloat(directMatch[2])
    };
  }

  return null;
}

// Helper function to find the most relevant skill for a specific gig
export function findMostRelevantSkill(workerSkills: any[], gigTitle: string, gigDescription: string): {
  skill: any;
  relevanceScore: number;
} {
  if (!workerSkills || workerSkills.length === 0) {
    return { skill: null, relevanceScore: 0 };
  }

  if (workerSkills.length === 1) {
    return { skill: workerSkills[0], relevanceScore: 50 }; // Default score for single skill
  }

  const gigText = `${gigTitle} ${gigDescription}`.toLowerCase();
  let bestSkill = workerSkills[0];
  let bestScore = 0;

  for (const skill of workerSkills) {
    const skillName = skill.name?.toLowerCase() || '';
    let score = 0;

    // Direct keyword matches (highest score)
    if (gigText.includes('baker') && (skillName.includes('baker') || skillName.includes('cake') || skillName.includes('pastry'))) {
      score = 100;
    } else if (gigText.includes('chef') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 100;
    } else if (gigText.includes('server') && (skillName.includes('server') || skillName.includes('waiter') || skillName.includes('bartender'))) {
      score = 100;
    } else if (gigText.includes('bartender') && (skillName.includes('bartender') || skillName.includes('mixologist'))) {
      score = 100;
    } else if (gigText.includes('waiter') && (skillName.includes('waiter') || skillName.includes('server'))) {
      score = 100;
    } else if (gigText.includes('cook') && (skillName.includes('cook') || skillName.includes('chef'))) {
      score = 100;
    }
    // Related matches (high score)
    else if (gigText.includes('baker') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 80;
    } else if (gigText.includes('server') && (skillName.includes('chef') || skillName.includes('cook'))) {
      score = 70;
    } else if (gigText.includes('bartender') && (skillName.includes('server') || skillName.includes('waiter'))) {
      score = 80;
    } else if (gigText.includes('waiter') && (skillName.includes('bartender') || skillName.includes('server'))) {
      score = 80;
    } else if (gigText.includes('chef') && (skillName.includes('baker') || skillName.includes('pastry'))) {
      score = 80;
    }
    // Hospitality/service matches (medium score)
    else if ((gigText.includes('server') || gigText.includes('waiter') || gigText.includes('bartender')) &&
             (skillName.includes('hospitality') || skillName.includes('service') || skillName.includes('customer'))) {
      score = 60;
    }
    // Food service matches (medium score)
    else if ((gigText.includes('chef') || gigText.includes('cook') || gigText.includes('baker')) &&
             (skillName.includes('food') || skillName.includes('kitchen') || skillName.includes('culinary'))) {
      score = 60;
    }
    // Event service matches (medium score)
    else if ((gigText.includes('event') || gigText.includes('catering') || gigText.includes('party')) &&
             (skillName.includes('event') || skillName.includes('catering') || skillName.includes('party'))) {
      score = 60;
    }
    // Generic matches (low score)
    else {
      score = 30;
    }

    // Bonus for higher experience years
    if (skill.experienceYears && skill.experienceYears > 0) {
      score += Math.min(skill.experienceYears * 2, 20); // Max 20 bonus points
    }

    // Bonus for higher hourly rate (indicates seniority)
    if (skill.agreedRate && parseFloat(skill.agreedRate) > 15) {
      score += 10;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return { skill: bestSkill, relevanceScore: bestScore };
}

// Helper function to check if worker is available during gig time
export function isWorkerAvailable(worker: any, gigStartTime: string, gigEndTime: string, availabilityData: any[]): boolean {
  const workerAvailability = availabilityData.filter((avail: any) => avail.userId === worker.id);

  if (workerAvailability.length === 0) {
    return true; // No availability data means assume available (more lenient)
  }

  // Check if any availability window covers the gig time
  return workerAvailability.some((avail: any) => {
    const availStart = avail.startTimeStr;
    const availEnd = avail.endTimeStr;

    // Simple time comparison (you might want to enhance this with proper date/time parsing)
    // For now, we'll assume if they have availability data, they're available
    // This could be enhanced to check specific days and times
    return availStart && availEnd;
  });
}

// Helper function to check if worker has any skills (AI will determine relevance)
export function hasRelevantSkills(worker: any, gigTitle: string, gigDescription: string): boolean {
  const workerSkills = worker.gigWorkerProfile?.skills || [];
  // Let AI determine if skills are relevant - just check if worker has any skills
  return workerSkills.length > 0;
}

// Extract gig coordinates from gig data
export function extractGigCoordinates(gig: any): { lat: number; lng: number } | null {
  if (gig.addressJson && typeof gig.addressJson === 'object') {
    const addressData = gig.addressJson as any;
    if (addressData.lat && addressData.lng) {
      return { lat: parseFloat(addressData.lat), lng: parseFloat(addressData.lng) };
    }
  }

  // Fallback to extracting from exact_location text
  return extractCoordinates(gig.exactLocation || '');
}

// Filter workers based on location and basic criteria
export function filterWorkersByCriteria(
  workers: any[],
  gig: any,
  gigCoords: { lat: number; lng: number } | null,
  availabilityData: any[]
): any[] {
  return workers.filter((worker: any) => {
    // Check if worker has any skills
    const hasSkills = hasRelevantSkills(worker, gig.titleInternal || '', gig.fullDescription || '');

    // Check availability
    const isAvailable = isWorkerAvailable(worker, gig.startTime?.toString() || '', gig.endTime?.toString() || '', availabilityData);

    // LOCATION IS MANDATORY - workers must be within 30km to be considered
    let withinRange = false;

    if (gigCoords) {
      let workerCoords = null;

      // Try to get coordinates from latitude/longitude fields first
      if (worker.gigWorkerProfile?.latitude && worker.gigWorkerProfile?.longitude) {
        const workerLat = parseFloat(worker.gigWorkerProfile.latitude.toString());
        const workerLng = parseFloat(worker.gigWorkerProfile.longitude.toString());

        if (!isNaN(workerLat) && !isNaN(workerLng)) {
          workerCoords = { lat: workerLat, lng: workerLng };
        }
      }

      // Fallback to parsing location string
      if (!workerCoords && worker.gigWorkerProfile?.location) {
        workerCoords = extractCoordinates(worker.gigWorkerProfile.location);
      }

      if (workerCoords) {
        const distance = calculateDistance(
          gigCoords.lat,
          gigCoords.lng,
          workerCoords.lat,
          workerCoords.lng
        );
        withinRange = distance <= 30;

        console.log(`Worker ${worker.fullName}: Distance ${distance.toFixed(2)}km, Within range: ${withinRange}, Has skills: ${hasSkills}, Available: ${isAvailable}`);
      } else {
        console.log(`Worker ${worker.fullName}: No valid worker coordinates, REJECTED - no coordinates`);
      }
    } else {
      console.log(`Worker ${worker.fullName}: No gig coordinates, REJECTED - cannot calculate distance`);
    }

    // HARD FILTER: Must be within 30km to be considered
    if (!withinRange) {
      console.log(`Worker ${worker.fullName}: REJECTED - outside 30km range`);
      return false;
    }

    // If within range, check other criteria for logging purposes
    console.log(`Worker ${worker.fullName}: ACCEPTED - within 30km range (skills: ${hasSkills}, available: ${isAvailable})`);

    return true;
  });
}

// Prepare gig context
export function prepareGigContext(gig: any) {
  return {
    title: gig.titleInternal,
    description: gig.fullDescription,
    location: gig.exactLocation,
    startTime: gig.startTime,
    endTime: gig.endTime,
    hourlyRate: gig.agreedRate,
    additionalRequirements: gig.notesForWorker,
  };
}

// Prepare worker data for AI analysis
export function prepareWorkerDataForAI(filteredWorkers: any[], availabilityData: any[]): any[] {
  return filteredWorkers.map((worker: any) => {
    const workerAvailability = availabilityData.filter((avail: any) => avail.userId === worker.id);
    return {
      workerId: worker.id,
      workerName: worker.fullName,
      bio: worker.gigWorkerProfile?.fullBio || undefined,
      location: worker.gigWorkerProfile?.location || undefined,
      skills: worker.gigWorkerProfile?.skills?.map((skill: any) => ({
        name: skill.name,
        experienceYears: skill.experienceYears,
        agreedRate: skill.agreedRate,
      })) || [],
      availability: workerAvailability.map((avail: any) => ({
        days: avail.days,
        startTime: avail.startTimeStr,
        endTime: avail.endTimeStr,
      })),
    };
  });
}

// Create matches from AI results
export function createMatchesFromAI(
  aiMatches: any[],
  filteredWorkers: any[],
  gig: any
): WorkerMatch[] {
  return aiMatches.map(match => {
    const worker = filteredWorkers.find((w: any) => w.id === match.workerId);

    const { skill: mostRelevantSkill, relevanceScore } = findMostRelevantSkill(
      worker?.gigWorkerProfile?.skills || [],
      gig.titleInternal || '',
      gig.fullDescription || ''
    );

    const primarySkill = mostRelevantSkill?.name || 'Professional';
    const hourlyRate = mostRelevantSkill?.agreedRate || 0;
    const experienceYears = mostRelevantSkill?.experienceYears || 0;

    console.log(`Worker ${worker?.fullName}: Selected skill "${primarySkill}" (relevance score: ${relevanceScore}) for gig "${gig.titleInternal}"`);

    return {
      workerId: match.workerId,
      workerName: match.workerName,
      primarySkill,
      bio: worker?.gigWorkerProfile?.fullBio || undefined,
      location: worker?.gigWorkerProfile?.location || undefined,
      hourlyRate: Number(hourlyRate),
      experienceYears: Number(experienceYears),
      matchScore: match.matchScore,
      matchReasons: match.matchReasons,
      availability: match.availability,
      skills: match.skills,
    };
  });
}

// Interfaces
export interface WorkerMatch {
  workerId: string;
  workerName: string;
  primarySkill: string;
  bio?: string;
  location?: string;
  hourlyRate: number;
  experienceYears: number;
  matchScore: number;
  matchReasons: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  }[];
  skills: {
    name: string;
    experienceYears: number;
    agreedRate: number;
  }[];
}

export interface MatchmakingResult {
  success: boolean;
  matches?: WorkerMatch[];
  error?: string;
  totalWorkersAnalyzed?: number;
}
