"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import { cancelRelatedPayments } from "@/lib/stripe/cancel-related-payments";

const ACCEPTED = gigStatusEnum.enumValues[2];
const CANCELLED_BY_BUYER = gigStatusEnum.enumValues[10];
const CANCELLED_BY_WORKER = gigStatusEnum.enumValues[11];

const getNewStatus = (
  action: "accept" | "cancel" | "start" | "complete",
  role: "buyer" | "worker"
) => {
  if (action === "accept") return ACCEPTED;
  return role === "buyer" ? CANCELLED_BY_BUYER : CANCELLED_BY_WORKER;
};

export async function updateGigOfferStatus({
  gigId,
  userId,
  role,
  action,
}: {
  gigId: string;
  userId: string;
  role: "buyer" | "worker";
  action: "accept" | "cancel" | "start" | "complete";
  isViewQA?: boolean;
}) {
  try {
    console.log("🔍 DEBUG: updateGigOfferStatus called with:", {
      gigId,
      userId,
      role,
      action,
    });

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
        firebaseUid: true,
        fullName: true,
      }
    });

    if (!user) {
      return { error: "User is not found", status: 404 };
    }

    const newStatus = getNewStatus(action, role);

    if (action === "accept" && role === "worker") {
      await db
        .update(GigsTable)
        .set({
          statusInternal: newStatus,
          workerUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(GigsTable.id, gigId));
    } else if (action === "cancel" && role === "worker") {
      await db
        .update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(eq(GigsTable.id, gigId));
    } else {
      const gigUserIdCondition =
        role === "buyer" ? GigsTable.buyerUserId : GigsTable.workerUserId;
      await db
        .update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(and(eq(GigsTable.id, gigId), eq(gigUserIdCondition, user.id)));
    }

    if (action === 'cancel') {
      await cancelRelatedPayments(gigId);
    }

    return { status: 200 };
  } catch (error: unknown) {
    console.error("Error updating gig:", error);
    return { error: error instanceof Error ? error.message : 'Unknown error updating gig', status: 500 };
  }
}
