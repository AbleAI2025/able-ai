"use server";

import { db } from "@/lib/drizzle/db";
import {
  UsersTable,
  WorkerAvailabilityTable,
  GigsTable
} from "@/lib/drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  extractGigCoordinates,
  filterWorkersByCriteria,
  prepareGigContext,
  prepareWorkerDataForAI,
  createMatchesFromAI,
  WorkerMatch,
  MatchmakingResult
} from "./ai-matchmaking-utils";
import { analyzeWorkerMatches } from "./ai-matchmaking-service";

// Re-export interfaces for compatibility
export type { WorkerMatch, MatchmakingResult };

export async function findMatchingWorkers(
  gigId: string
): Promise<MatchmakingResult> {
  try {
    // Get the gig details
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, gigId),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!gig) {
      return { success: false, error: "Gig not found" };
    }

    // Get all active workers with their profiles and skills (excluding the gig creator)
    const workers = await db.query.UsersTable.findMany({
      where: and(
        eq(UsersTable.isGigWorker, true),
        eq(UsersTable.isBanned, false),
        eq(UsersTable.isDisabled, false),
        sql`${UsersTable.id} != ${gig.buyerUserId}` // Exclude the gig creator
      ),
      with: {
        gigWorkerProfile: {
          with: {
            skills: true,
          },
        },
      },
    });

    // Get availability for all workers
    const workerIds = workers.map(w => w.id);
    let availabilityData: any[] = [];
    
    if (workerIds.length > 0) {
      try {
        // Use raw SQL with proper array formatting for PostgreSQL and UUID casting
        availabilityData = await db.query.WorkerAvailabilityTable.findMany({
          where: sql`${WorkerAvailabilityTable.userId} = ANY(${sql.raw(`ARRAY[${workerIds.map(id => `'${id}'::uuid`).join(',')}]`)})`,
        });
      } catch (error) {
        console.error('Error fetching worker availability:', error);
        // Continue without availability data if there's an error
        availabilityData = [];
      }
    }

    console.log(`Found ${workers.length} active workers to analyze`);

    if (workers.length === 0) {
      return { 
        success: true, 
        matches: [], 
        totalWorkersAnalyzed: 0,
        error: "No active workers found" 
      };
    }

    // Prepare gig context and extract coordinates
    const gigContext = prepareGigContext(gig);
    const gigCoords = extractGigCoordinates(gig);
    



    // Filter workers by criteria
    const filteredWorkers = filterWorkersByCriteria(workers, gig, gigCoords, availabilityData);
    console.log(`Filtered ${filteredWorkers.length} workers from ${workers.length} total (MANDATORY: within 30km range)`);

    // Prepare worker data for AI analysis
    const workerData = prepareWorkerDataForAI(filteredWorkers, availabilityData);

    // Use AI to analyze and score matches via API route
    const aiMatches = await analyzeWorkerMatches(gigContext, workerData);

    // Convert AI results to WorkerMatch format
    const matches = createMatchesFromAI(aiMatches, filteredWorkers, gig);

    // Sort by match score (highest first)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Return top 5 matches
    const topMatches = matches.slice(0, 5);

    return {
      success: true,
      matches: topMatches,
      totalWorkersAnalyzed: filteredWorkers.length,
    };

  } catch (error) {
    console.error("Error in AI matchmaking:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

