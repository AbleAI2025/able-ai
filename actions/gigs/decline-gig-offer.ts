"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNull } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import { cancelRelatedPayments } from "@/lib/stripe/cancel-related-payments";

// Use the exact string value for declined status
const DECLINED_BY_WORKER = "DECLINED_BY_WORKER";

export async function declineGigOffer({
  gigId,
  userId,
}: {
  gigId: string;
  userId: string;
}) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      },
    });

    if (!user) {
      return { success: false, error: "User not found", status: 404 };
    }

    const gig = await db.query.GigsTable.findFirst({
      where: and(
        eq(GigsTable.id, gigId),
        eq(GigsTable.statusInternal, gigStatusEnum.enumValues[0]),
        isNull(GigsTable.workerUserId)
      ),
      columns: {
        id: true,
        expiresAt: true,
      },
    });

    if (!gig) {
      return {
        success: false,
        error: "Gig not found or not available for declining",
        status: 404,
      };
    }

    if (gig.expiresAt && new Date(gig.expiresAt) < new Date()) {
      return {
        success: false,
        error: "This gig offer has expired",
        status: 400,
      };
    }

    const result = await db
      .update(GigsTable)
      .set({
        statusInternal: DECLINED_BY_WORKER,
        updatedAt: new Date(),
      })
      .where(eq(GigsTable.id, gigId));

    if (result.rowCount === 0) {
      return {
        success: false,
        error: "Failed to decline gig offer",
        status: 500,
      };
    }

    await cancelRelatedPayments(gig.id);

    return {
      success: true,
      status: 200,
      message: "Gig offer declined successfully",
    };
  } catch (error: unknown) {
    console.error("Error declining gig offer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to decline gig offer",
      status: 500,
    };
  }
}
