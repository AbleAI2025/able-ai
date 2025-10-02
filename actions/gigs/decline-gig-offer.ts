"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNotNull } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import admin from "@/lib/firebase/firebase-server";

// Use the exact string value for declined status
const DECLINED_BY_WORKER = "DECLINED_BY_WORKER";

export async function declineGigOffer({
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
        isNotNull(GigsTable.workerUserId)
      ),
      columns: {
        id: true,
        expiresAt: true,
      },
      with: {
        buyer: { columns: { id: true } },
        worker: { columns: { id: true, fullName: true } },
      }
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


    const message: admin.messaging.Message = {
      notification: {
        title: `Gig Cancelled by Worker: ${gig.worker?.fullName}`,
        body: `The worker has cancelled the gig.`,
      },
      android: {
        priority: "high",
      },
      webpush: {
        headers: {
          Urgency: "high",
        },
        notification: {
          click_action: `/buyer/gigs/${gigId}`,
        },
      },
      data: {
        gigId,
        type: "GIG_CANCELLED_BY_WORKER",
      },
      topic: gig.buyer.id,
    };

    const notificationRes = await admin.messaging().send(message);

    console.log("Notification sent:", notificationRes);
    

    //await cancelRelatedPayments(gig.id);

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
