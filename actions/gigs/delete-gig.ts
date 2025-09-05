"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

const PENDING_WORKER_ACCEPTANCE = gigStatusEnum.enumValues[0];

export async function deleteGig({ gigId, userId }: { gigId: string; userId: string }) {
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

    // Check if the gig exists and belongs to this user as a buyer
    const gig = await db.query.GigsTable.findFirst({
      where: and(
        eq(GigsTable.id, gigId),
        eq(GigsTable.buyerUserId, user.id)
      ),
      columns: {
        id: true,
        statusInternal: true,
      }
    });

    if (!gig) {
      return { error: 'Gig not found or you do not have permission to delete it', status: 404 };
    }

    // Only allow deletion if gig is in PENDING_WORKER_ACCEPTANCE status
    if (gig.statusInternal !== PENDING_WORKER_ACCEPTANCE) {
      return { error: 'Can only delete gigs that are not yet accepted', status: 400 };
    }

    // Delete the gig
    await db.delete(GigsTable)
      .where(eq(GigsTable.id, gigId));

    return { status: 200, message: 'Gig deleted successfully' };

  } catch (error: unknown) {
    console.error("Error deleting gig:", error);
    return { error: error instanceof Error ? error.message : 'Failed to delete gig', status: 500 };
  }
}
