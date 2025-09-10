"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, desc } from "drizzle-orm";
import { GigAmendmentRequestsTable, UsersTable } from "@/lib/drizzle/schema";

export async function findExistingGigAmendment({ gigId, userId }: { gigId: string; userId: string }) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { error: 'User not found' };

    const amendment = await db.query.GigAmendmentRequestsTable.findFirst({
      where: and(
        eq(GigAmendmentRequestsTable.gigId, gigId),
        eq(GigAmendmentRequestsTable.requesterId, user.id),
        eq(GigAmendmentRequestsTable.status, "PENDING")
      ),
      columns: { id: true },
      orderBy: [desc(GigAmendmentRequestsTable.createdAt)],
    });

    return { amendId: amendment?.id || null };
  } catch (error) {
    console.error("Error finding existing gig amendment:", error);
    return { error: "Failed to check for existing amendments." };
  }
}

// Action 2: Create a new amendment request
export async function createGigAmendment(data: {
  amendId: string;
  gigId: string;
  userId: string;
  requestType: string;
  newValues: Record<string, any>;
  reason?: string;
}) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, data.userId),
      columns: { id: true },
    });
    if (!user) return { error: 'User not found' };
    const commonValues = {
      gigId: data.gigId,
      requestType: data.requestType,
      newValues: data.newValues,
      reason: data.reason,
      status: "PENDING" as const,
    };

    let amendment;
    if (data.amendId === "new") {
      [amendment] = await db
        .insert(GigAmendmentRequestsTable)
        .values({ ...commonValues, requesterId: user.id })
        .returning({ id: GigAmendmentRequestsTable.id });
    } else {
      [amendment] = await db
        .update(GigAmendmentRequestsTable)
        .set({ ...commonValues, updatedAt: new Date() })
        .where(
          and(
            eq(GigAmendmentRequestsTable.id, data.amendId),
            eq(GigAmendmentRequestsTable.requesterId, user.id)
          )
        )
        .returning({ id: GigAmendmentRequestsTable.id });
    }

    if (!amendment?.id) {
      return { error: "Failed to create amendment request." };
    }

    return { success: true, amendmentId: amendment.id };
  } catch (error) {
    console.error("Error creating gig amendment:", error);
    return { error: "An unexpected error occurred." };
  }
}

// Action 3: Get details for a specific amendment
export async function getGigAmendmentDetails({ amendmentId }: { amendmentId: string }) {
  try {
    const amendment = await db.query.GigAmendmentRequestsTable.findFirst({
      where: eq(GigAmendmentRequestsTable.id, amendmentId),
    });
    if (!amendment) return { error: "Amendment not found." };
    return { amendment };
  } catch (error) {
    console.error("Error getting amendment details:", error);
    return { error: "Failed to fetch amendment details." };
  }
}


// Action 4: Cancel (soft delete) an amendment request
export async function cancelGigAmendment({ amendmentId, userId }: { amendmentId: string; userId: string }) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: { id: true },
    });
    if (!user) return { error: 'User not found' };

    const [updatedAmendment] = await db.update(GigAmendmentRequestsTable)
      .set({ status: "WITHDRAWN", updatedAt: new Date() })
      .where(and(
        eq(GigAmendmentRequestsTable.id, amendmentId),
        eq(GigAmendmentRequestsTable.requesterId, user.id)
      ))
      .returning({ id: GigAmendmentRequestsTable.id });

    if (!updatedAmendment) {
      return { error: "Amendment not found or you don't have permission to cancel it." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error cancelling gig amendment:", error);
    return { error: "Failed to cancel amendment." };
  }
}
