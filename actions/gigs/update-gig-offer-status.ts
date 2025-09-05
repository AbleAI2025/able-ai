"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

const ACCEPTED = gigStatusEnum.enumValues[2];
const CANCELLED_BY_BUYER = gigStatusEnum.enumValues[10];
const CANCELLED_BY_WORKER = gigStatusEnum.enumValues[11];

const getNewStatus = (action: 'accept' | 'cancel' | 'start' | 'complete', role: 'buyer' | 'worker') => {
  if (action === 'accept') return ACCEPTED;
  return role === 'buyer' ? CANCELLED_BY_BUYER : CANCELLED_BY_WORKER;
};

export async function updateGigOfferStatus({ gigId, userId, role, action }: { gigId: string; userId: string; role: 'buyer' | 'worker'; action: 'accept' | 'cancel' | 'start' | 'complete'; isViewQA?: boolean; }) {

  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      }
    });

    if (!user) {
      return { error: 'User is not found', status: 404 };
    }

    const newStatus = getNewStatus(action, role);
    
    // For declining offers, we need to check if the gig exists and is available for the worker
    // For accepting offers, we need to assign the worker to the gig
    if (action === 'cancel' && role === 'worker') {
      // For declining, we just update the status without requiring worker assignment
      await db.update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(eq(GigsTable.id, gigId));
    } else {
      // For other actions, use the original logic
      const gigUserIdCondition = role === 'buyer' ? GigsTable.buyerUserId : GigsTable.workerUserId;
      await db.update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(and(eq(GigsTable.id, gigId), eq(gigUserIdCondition, user.id)));
    }

    return { status: 200 };

  } catch (error: unknown) {
    console.error("Error updating gig:", error);
        return { error: error instanceof Error ? error.message : 'Unknown error updating gig', status: 500 };
  }
}
