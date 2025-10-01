"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";

// Use the exact string value instead of accessing by index
const ACCEPTED = gigStatusEnum.enumValues[2];

export async function acceptGigOffer({
  gigId,
  userUid,
}: {
  gigId: string;
  userUid: string;
}) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userUid),
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
        isNotNull(GigsTable.workerUserId),
        eq(GigsTable.workerUserId, user.id)
      ),
      columns: {
        id: true,
        expiresAt: true,
      },
    });

    if (!gig) {
      return {
        success: false,
        error: "Gig not found or not available for acceptance",
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
        workerUserId: user.id,
        statusInternal: ACCEPTED,
        updatedAt: new Date(),
      })
      .where(eq(GigsTable.id, gig.id));

    if (result.rowCount === 0) {
      return {
        success: false,
        error: "Failed to update gig offer",
        status: 500,
      };
    }

    return {
      success: true,
      status: 200,
      message: "Gig offer accepted successfully",
    };
  } catch (error: unknown) {
    console.error("Error accepting gig offer:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to accept gig offer",
      status: 500,
    };
  }
}
