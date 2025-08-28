"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, GigWorkerProfilesTable, SkillsTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export interface WorkerDetails {
  id: string;
  name: string;
  email: string;
  primarySkill: string;
  bio?: string;
}

export async function getWorkerDetailsAction(workerId: string): Promise<{
  success: boolean;
  data?: WorkerDetails;
  error?: string;
}> {
  try {
    if (!workerId) {
      return {
        success: false,
        error: "Worker ID is required"
      };
    }

    // Get worker user details
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, workerId),
      columns: {
        id: true,
        fullName: true,
        email: true,
      }
    });

    if (!user) {
      return {
        success: false,
        error: "Worker not found"
      };
    }

    // Get worker profile
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    // Get primary skill (first skill or default)
    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerProfile?.id || ''),
      limit: 1,
    });

    const primarySkill = skills[0]?.name || 'Professional';

    return {
      success: true,
      data: {
        id: user.id,
        name: user.fullName || 'Unknown Worker',
        email: user.email,
        primarySkill,
        bio: workerProfile?.fullBio || undefined,
      }
    };

  } catch (error) {
    console.error('Error fetching worker details:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

// This function is now implemented in actions/user/recommendations.ts
// and can be imported from there if needed
