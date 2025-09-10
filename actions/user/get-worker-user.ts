"use server";

import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import { GigWorkerProfilesTable, UsersTable } from "@/lib/drizzle/schema";

export interface WorkerUser {
  uid: string;
  displayName?: string;
  email?: string;
  id: string;
}

export async function getWorkerUserFromProfileId(uid: string): Promise<{
  success: boolean;
  data?: WorkerUser;
  error?: string;
}> {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }
    
    if (!uid) {
      return {
        success: false,
        error: "User profile ID is required"
      };
    }

    // Get worker profile with associated user
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
       where: eq(GigWorkerProfilesTable.userId, user.id),
      with: {
        user: {
          columns: {
            id: true,
            firebaseUid: true,
            fullName: true,
            email: true,
          }
        }
      }
    });


    if (!workerProfile?.user) {
      return {
        success: false,
        error: "Worker profile or user not found"
      };
    }

    const workerUser: WorkerUser = {
      uid: workerProfile.user.firebaseUid,
      displayName: workerProfile.user.fullName || undefined,
      email: workerProfile.user.email || undefined,
      id: workerProfile.user.id,
    };

    return {
      success: true,
      data: workerUser
    };

  } catch (error) {
    console.error('Error fetching worker user from profile ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
