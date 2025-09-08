"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, GigWorkerProfilesTable, SkillsTable, GigsTable } from "@/lib/drizzle/schema";
import { eq, and, ne, like, or } from "drizzle-orm";
import { isUserAuthenticated } from "@/lib/user.server";
import { ERROR_CODES } from "@/lib/responses/errors";

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
}

export async function searchWorkersForDelegation(
  token: string,
  gigId: string,
  searchTerm: string = ""
) {
  try {
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

    // Get gig details to verify ownership and get current worker
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      columns: {
        id: true,
        buyerUserId: true,
        workerUserId: true,
        statusInternal: true
      }
    });

    if (!gig) {
      return { error: 'Gig not found', status: 404 };
    }

    // Verify user is the buyer of this gig
    if (gig.buyerUserId !== user.id) {
      return { error: 'Unauthorized to delegate this gig', status: 403 };
    }

    // Check if gig is in a state that allows delegation
    const allowedStatuses = ['ACCEPTED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(gig.statusInternal)) {
      return { 
        error: `Cannot delegate gig with status: ${gig.statusInternal}`, 
        status: 400 
      };
    }

    // Build search query
    const searchPattern = searchTerm ? `%${searchTerm.toLowerCase()}%` : '%';
    
    // Search for workers (excluding current worker)
    const workers = await db
      .select({
        id: UsersTable.id,
        fullName: UsersTable.fullName,
        email: UsersTable.email,
        bio: GigWorkerProfilesTable.fullBio,
        location: GigWorkerProfilesTable.location,
        skillName: SkillsTable.name,
        experienceYears: SkillsTable.experienceYears,
        agreedRate: SkillsTable.agreedRate,
      })
      .from(UsersTable)
      .innerJoin(GigWorkerProfilesTable, eq(UsersTable.id, GigWorkerProfilesTable.userId))
      .leftJoin(SkillsTable, eq(GigWorkerProfilesTable.id, SkillsTable.workerProfileId))
      .where(
        and(
          gig.workerUserId ? ne(UsersTable.id, gig.workerUserId) : undefined, // Exclude current worker if exists
          or(
            like(UsersTable.fullName, searchPattern),
            like(UsersTable.email, searchPattern),
            like(SkillsTable.name, searchPattern)
          )
        )
      )
      .limit(20);

    // Group workers by ID and get primary skill
    const workerMap = new Map<string, WorkerSearchResult>();
    
    for (const worker of workers) {
      if (!workerMap.has(worker.id)) {
        workerMap.set(worker.id, {
          id: worker.id,
          name: worker.fullName || 'Unknown Worker',
          username: worker.email?.split('@')[0] || 'user',
          avatarUrl: '/images/default-avatar.svg',
          primarySkill: worker.skillName || 'Professional',
          experienceYears: parseFloat(String(worker.experienceYears || '0')),
          hourlyRate: parseFloat(worker.agreedRate || '0'),
          bio: worker.bio || '',
          location: worker.location || 'Location not specified'
        });
      }
    }

    const results = Array.from(workerMap.values());

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
