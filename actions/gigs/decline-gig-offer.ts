"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNull } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

// Use the exact string value for declined status
const DECLINED_BY_WORKER = "DECLINED_BY_WORKER";

export async function declineGigOffer({ gigId, userId }: { gigId: string; userId: string }) {
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

    // Check if the gig exists and is available for declining
    const gig = await db.query.GigsTable.findFirst({
      where: and(
        eq(GigsTable.id, gigId),
        eq(GigsTable.statusInternal, gigStatusEnum.enumValues[0]), // PENDING_WORKER_ACCEPTANCE
        isNull(GigsTable.workerUserId) // Ensure no worker is assigned yet
      ),
    });

    if (!gig) {
      return { error: 'Gig not found or not available for declining', status: 404 };
    }

    // Update the gig status to declined
    await db.update(GigsTable)
      .set({ 
        statusInternal: DECLINED_BY_WORKER,
        updatedAt: new Date()
      })
      .where(eq(GigsTable.id, gigId));

    return { 
      success: true, 
      status: 200,
      message: 'Gig offer declined successfully'
    };

  } catch (error: any) {
    console.error('Error declining gig offer:', error);
    return { 
      error: error.message || 'Failed to decline gig offer', 
      status: 500 
    };
  }
}
