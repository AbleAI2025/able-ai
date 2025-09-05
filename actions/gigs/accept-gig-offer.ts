"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNull } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

// Use the exact string value instead of accessing by index
const ACCEPTED = gigStatusEnum.enumValues[2];

export async function acceptGigOffer({ gigId, userId }: { gigId: string; userId: string }) {
  try {
    // First, verify the user exists and get their ID
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      }
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Check if the gig exists and is available for acceptance
    const gig = await db.query.GigsTable.findFirst({
      where: and(
        eq(GigsTable.id, gigId),
        eq(GigsTable.statusInternal, gigStatusEnum.enumValues[0]), // PENDING_WORKER_ACCEPTANCE
        isNull(GigsTable.workerUserId) // Ensure no worker is assigned yet
      ),
    });

    if (!gig) {
      return { error: 'Gig not found or not available for acceptance', status: 404 };
    }

    // Update the gig to assign the worker and change status
    await db.update(GigsTable)
      .set({ 
        workerUserId: user.id,
        statusInternal: ACCEPTED,
        updatedAt: new Date()
      })
      .where(eq(GigsTable.id, gigId));

    return { 
      success: true, 
      status: 200,
      message: 'Gig offer accepted successfully'
    };

  } catch (error: unknown) {
    console.error('Error accepting gig offer:', error);
    return { 
      error: error instanceof Error ? error.message : 'Failed to accept gig offer', 
      status: 500 
    };
  }
}
