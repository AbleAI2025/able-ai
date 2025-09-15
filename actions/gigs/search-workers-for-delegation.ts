"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, GigWorkerProfilesTable, SkillsTable, GigsTable, WorkerAvailabilityTable } from "@/lib/drizzle/schema";
import { eq, and, ne, like, or, gte, lte, sql } from "drizzle-orm";
import { isUserAuthenticated } from "@/lib/user.server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isWorkerWithinDistance, calculateDistance, parseCoordinates } from "@/lib/utils/distance";

// Constants
const DELEGATION_SEARCH_RADIUS_KM = 30;
const MAX_RESULTS = 50;

export interface WorkerSearchResult {
  id: string;
  name: string;
  username: string;
  avatarUrl: string;
  primarySkill: string;
  experienceYears: number;
  hourlyRate: number;
  bio: string;
  location: string;
  distance: number;
  skillMatchScore: number;
  availabilityScore: number;
  overallScore: number;
  skills: Array<{
    name: string;
    experienceYears: number;
    agreedRate: number;
  }>;
  isAvailable: boolean;
  lastActive?: string;
}

export interface SearchFilters {
  searchTerm?: string;
  minExperience?: number;
  maxRate?: number;
  minRate?: number;
  skills?: string[];
  availableOnly?: boolean;
  sortBy?: 'relevance' | 'distance' | 'experience' | 'rate';
}

export async function searchWorkersForDelegation(
  token: string,
  gigId: string,
  searchTerm: string = "",
  filters: SearchFilters = {}
) {
  try {
    console.log('🔍 DEBUG: Enhanced delegation search called with:', { gigId, searchTerm, filters });
    
    // Authenticate user
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    // Get user details
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      columns: { id: true, fullName: true }
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Get gig details with more information for better matching
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      columns: {
        id: true,
        buyerUserId: true,
        workerUserId: true,
        statusInternal: true,
        exactLocation: true,
        addressJson: true,
        titleInternal: true,
        fullDescription: true,
        startTime: true,
        endTime: true,
        agreedRate: true
      }
    });

    if (!gig) {
      return { error: 'Gig not found', status: 404 };
    }

    // Verify user is either the buyer or the assigned worker of this gig
    if (gig.buyerUserId !== user.id && gig.workerUserId !== user.id) {
      return { error: 'Unauthorized to delegate this gig', status: 403 };
    }

    // Check if gig is in a state that allows delegation
    const allowedStatuses = ['PENDING_WORKER_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'];
    
    if (!allowedStatuses.includes(gig.statusInternal)) {
      return { 
        error: `Cannot delegate gig with status: ${gig.statusInternal}`, 
        status: 400 
      };
    }

    // Get gig coordinates for distance calculation
    const gigLocation = gig.exactLocation || gig.addressJson;
    const gigCoords = parseCoordinates(gigLocation);
    
    console.log('🔍 DEBUG: Delegation search - excluding users:', {
      buyerUserId: gig.buyerUserId,
      workerUserId: gig.workerUserId,
      currentUser: user.id
    });
    
    // Build enhanced search query
    const searchPattern = searchTerm ? `%${searchTerm.toLowerCase()}%` : '%';
    
    // Get all workers with their skills and availability
    const workers = await db
      .select({
        id: UsersTable.id,
        fullName: UsersTable.fullName,
        email: UsersTable.email,
        bio: GigWorkerProfilesTable.fullBio,
        location: GigWorkerProfilesTable.location,
        latitude: GigWorkerProfilesTable.latitude,
        longitude: GigWorkerProfilesTable.longitude,
        skillName: SkillsTable.name,
        experienceYears: SkillsTable.experienceYears,
        agreedRate: SkillsTable.agreedRate,
        lastActive: UsersTable.updatedAt,
      })
      .from(UsersTable)
      .innerJoin(GigWorkerProfilesTable, eq(UsersTable.id, GigWorkerProfilesTable.userId))
      .leftJoin(SkillsTable, eq(GigWorkerProfilesTable.id, SkillsTable.workerProfileId))
      .where(
        and(
          // Exclude current worker if exists (to prevent self-delegation)
          gig.workerUserId ? ne(UsersTable.id, gig.workerUserId) : undefined,
          // Exclude buyer if they are also a worker (to prevent buyer from delegating to themselves)
          gig.buyerUserId ? ne(UsersTable.id, gig.buyerUserId) : undefined,
          // Apply search filters if search term is provided
          searchTerm ? or(
            like(UsersTable.fullName, searchPattern),
            like(UsersTable.email, searchPattern),
            like(SkillsTable.name, searchPattern),
            like(GigWorkerProfilesTable.fullBio, searchPattern)
          ) : undefined
        )
      )
      .limit(MAX_RESULTS);

    // Group workers by ID and calculate scores
    const workerMap = new Map<string, WorkerSearchResult>();
    
    for (const worker of workers) {
      if (!workerMap.has(worker.id)) {
        // Calculate distance
        let distance = 0;
        let isWithinDistance = true;
        
        if (gigCoords && worker.latitude && worker.longitude) {
          const workerLat = parseFloat(worker.latitude.toString());
          const workerLng = parseFloat(worker.longitude.toString());
          
          if (!isNaN(workerLat) && !isNaN(workerLng)) {
            distance = calculateDistance(
              gigCoords.lat,
              gigCoords.lon,
              workerLat,
              workerLng
            );
            isWithinDistance = distance <= DELEGATION_SEARCH_RADIUS_KM;
          }
        } else if (gigCoords && worker.location) {
          const workerCoords = parseCoordinates(worker.location);
          if (workerCoords) {
            distance = calculateDistance(
              gigCoords.lat,
              gigCoords.lon,
              workerCoords.lat,
              workerCoords.lon
            );
            isWithinDistance = distance <= DELEGATION_SEARCH_RADIUS_KM;
          }
        }
        
        // Only include workers within distance
        if (isWithinDistance) {
          // Calculate skill match score based on gig requirements
          const skillMatchScore = calculateSkillMatchScore(worker, gig);
          
          // Calculate availability score
          const availabilityScore = await calculateAvailabilityScore(worker.id, gig);
          
          // Calculate overall score
          const overallScore = (skillMatchScore * 0.4) + (availabilityScore * 0.3) + ((1 - distance / DELEGATION_SEARCH_RADIUS_KM) * 0.3);
          
          workerMap.set(worker.id, {
            id: worker.id,
            name: worker.fullName || 'Unknown Worker',
            username: worker.email?.split('@')[0] || 'user',
            avatarUrl: '/images/default-avatar.svg',
            primarySkill: worker.skillName || 'Professional',
            experienceYears: parseFloat(String(worker.experienceYears || '0')),
            hourlyRate: parseFloat(worker.agreedRate || '0'),
            bio: worker.bio || '',
            location: worker.location || 'Location not specified',
            distance: Math.round(distance * 100) / 100,
            skillMatchScore: Math.round(skillMatchScore * 100) / 100,
            availabilityScore: Math.round(availabilityScore * 100) / 100,
            overallScore: Math.round(overallScore * 100) / 100,
            skills: [], // Will be populated below
            isAvailable: availabilityScore > 0.5,
            lastActive: worker.lastActive?.toString()
          });
        }
      }
    }

    // Get all skills for each worker
    for (const [workerId, worker] of workerMap) {
      const workerSkills = await db
        .select({
          name: SkillsTable.name,
          experienceYears: SkillsTable.experienceYears,
          agreedRate: SkillsTable.agreedRate,
        })
        .from(SkillsTable)
        .innerJoin(GigWorkerProfilesTable, eq(SkillsTable.workerProfileId, GigWorkerProfilesTable.id))
        .where(eq(GigWorkerProfilesTable.userId, workerId));
      
      // Convert string values to numbers for skills array
      worker.skills = workerSkills.map(skill => ({
        name: skill.name,
        experienceYears: parseFloat(String(skill.experienceYears || '0')),
        agreedRate: parseFloat(String(skill.agreedRate || '0'))
      }));
      
      // Update primary skill to the most relevant one
      if (workerSkills.length > 0) {
        const mostRelevantSkill = findMostRelevantSkill(workerSkills, gig.titleInternal || '', gig.fullDescription || '');
        worker.primarySkill = mostRelevantSkill.name;
        worker.experienceYears = parseFloat(String(mostRelevantSkill.experienceYears || '0'));
        worker.hourlyRate = parseFloat(String(mostRelevantSkill.agreedRate || '0'));
      }
    }

    // Apply filters
    let results = Array.from(workerMap.values());
    
    if (filters.minExperience) {
      results = results.filter(w => w.experienceYears >= filters.minExperience!);
    }
    
    if (filters.maxRate) {
      results = results.filter(w => w.hourlyRate <= filters.maxRate!);
    }
    
    if (filters.minRate) {
      results = results.filter(w => w.hourlyRate >= filters.minRate!);
    }
    
    if (filters.availableOnly) {
      results = results.filter(w => w.isAvailable);
    }
    
    if (filters.skills && filters.skills.length > 0) {
      results = results.filter(w => 
        w.skills.some(skill => 
          filters.skills!.some(filterSkill => 
            skill.name.toLowerCase().includes(filterSkill.toLowerCase())
          )
        )
      );
    }

    // Sort results
    const sortBy = filters.sortBy || 'relevance';
    switch (sortBy) {
      case 'distance':
        results.sort((a, b) => a.distance - b.distance);
        break;
      case 'experience':
        results.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      case 'rate':
        results.sort((a, b) => a.hourlyRate - b.hourlyRate);
        break;
      case 'relevance':
      default:
        results.sort((a, b) => b.overallScore - a.overallScore);
        break;
    }

    console.log(`🔍 DEBUG: Found ${results.length} workers for delegation`);

    return { 
      success: true, 
      data: results,
      count: results.length 
    };

  } catch (error: any) {
    console.error('Error searching workers for delegation:', error);
    return { 
      error: error.message || 'Failed to search workers', 
      status: 500 
    };
  }
}

// Helper function to calculate skill match score
function calculateSkillMatchScore(worker: any, gig: any): number {
  const gigTitle = (gig.titleInternal || '').toLowerCase();
  const gigDescription = (gig.fullDescription || '').toLowerCase();
  const workerSkill = (worker.skillName || '').toLowerCase();
  
  if (!workerSkill) return 0;
  
  let score = 0;
  
  // Check if skill name appears in gig title
  if (gigTitle.includes(workerSkill)) {
    score += 0.5;
  }
  
  // Check if skill name appears in gig description
  if (gigDescription.includes(workerSkill)) {
    score += 0.3;
  }
  
  // Check for related keywords
  const relatedKeywords = getRelatedKeywords(workerSkill);
  for (const keyword of relatedKeywords) {
    if (gigTitle.includes(keyword) || gigDescription.includes(keyword)) {
      score += 0.1;
    }
  }
  
  return Math.min(score, 1);
}

// Helper function to get related keywords for a skill
function getRelatedKeywords(skill: string): string[] {
  const keywordMap: { [key: string]: string[] } = {
    'plumbing': ['pipe', 'water', 'drain', 'toilet', 'sink', 'bathroom'],
    'electrical': ['wire', 'power', 'outlet', 'switch', 'light', 'electric'],
    'carpentry': ['wood', 'furniture', 'cabinet', 'shelf', 'table', 'chair'],
    'cleaning': ['clean', 'tidy', 'organize', 'vacuum', 'mop', 'dust'],
    'gardening': ['garden', 'plant', 'lawn', 'flower', 'tree', 'landscape'],
    'painting': ['paint', 'color', 'wall', 'brush', 'coating', 'finish'],
    'moving': ['move', 'transport', 'carry', 'relocate', 'pack', 'unpack'],
    'cooking': ['cook', 'food', 'meal', 'kitchen', 'recipe', 'chef'],
    'photography': ['photo', 'camera', 'picture', 'shoot', 'event', 'portrait'],
    'tutoring': ['teach', 'learn', 'study', 'education', 'student', 'lesson']
  };
  
  return keywordMap[skill] || [];
}

// Helper function to find most relevant skill
function findMostRelevantSkill(skills: any[], gigTitle: string, gigDescription: string): any {
  if (skills.length === 0) return { name: 'Professional', experienceYears: 0, agreedRate: 0 };
  
  let bestSkill = skills[0];
  let bestScore = 0;
  
  for (const skill of skills) {
    const score = calculateSkillMatchScore({ skillName: skill.name }, { titleInternal: gigTitle, fullDescription: gigDescription });
    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }
  
  return bestSkill;
}

// Helper function to calculate availability score
async function calculateAvailabilityScore(workerId: string, gig: any): Promise<number> {
  try {
    // Check if worker has availability for the gig time
    const availability = await db.query.WorkerAvailabilityTable.findFirst({
      where: eq(WorkerAvailabilityTable.userId, workerId),
      columns: {
        days: true,
        frequency: true,
        startDate: true,
        endDate: true
      }
    });
    
    if (!availability?.days) return 0.5; // Default score if no availability data
    
    // Simple availability check - in a real implementation, you'd parse the availability JSON
    // and check if the worker is available during the gig time
    return 0.8; // Placeholder score
  } catch (error) {
    console.error('Error calculating availability score:', error);
    return 0.5;
  }
}
