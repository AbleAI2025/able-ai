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

export async function getWorkerUserFromProfileId(workerProfileId: string): Promise<{
  success: boolean;
  data?: WorkerUser;
  error?: string;
}> {
  try {
    if (!workerProfileId) {
      return {
        success: false,
        error: "Worker profile ID is required"
      };
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerProfileId),
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

export async function getWorkerUserFromFirebaseId(firebaseUid: string): Promise<{
  success: boolean;
  data?: WorkerUser;
  error?: string;
}> {
  try {
    if (!firebaseUid) {
      return {
        success: false,
        error: "Firebase UID is required",
      };
    }

    console.log(`🔍 Looking up worker user for Firebase UID: ${firebaseUid}`);

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      columns: {
        id: true,
        firebaseUid: true,
        fullName: true,
        email: true,
      },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    const workerUser: WorkerUser = {
      uid: user.firebaseUid,
      displayName: user.fullName || undefined,
      email: user.email || undefined,
      id: user.id,
    };

    return {
      success: true,
      data: workerUser,
    };
  } catch (error) {
    console.error('Error fetching worker user from Firebase UID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
