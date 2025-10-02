"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq } from "drizzle-orm";
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import admin from "@/lib/firebase/firebase-server";

const ACCEPTED = gigStatusEnum.enumValues[2];
const CANCELLED_BY_BUYER = gigStatusEnum.enumValues[10];
const CANCELLED_BY_WORKER = gigStatusEnum.enumValues[11];
const COMPLETED = gigStatusEnum.enumValues[7];
const STARTED = gigStatusEnum.enumValues[3];

const getNewStatus = (
  action: "accept" | "cancel" | "start" | "complete",
  role: "buyer" | "worker"
) => {
  if (action === "accept") return ACCEPTED;
  if (action === "cancel" && role === "buyer") return CANCELLED_BY_BUYER;
  if (action === "cancel" && role === "worker") return CANCELLED_BY_WORKER;
  if (action === "start") return STARTED;
  if (action === "complete") return COMPLETED;
  throw new Error("Invalid action or role");
};

export async function updateGigOfferStatus({
  gigId,
  userUid,
  role,
  action,
}: {
  gigId: string;
  userUid: string;
  role: "buyer" | "worker";
  action: "accept" | "cancel" | "start" | "complete";
  isViewQA?: boolean;
}) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userUid),
      columns: {
        id: true,
        firebaseUid: true,
        fullName: true,
      },
    });

    if (!user) {
      return { success: false, error: "User is not found", status: 404 };
    }

    const newStatus = getNewStatus(action, role);

    const validateGigNotExpired = async () => {
      const gig = await db.query.GigsTable.findFirst({
        where: eq(GigsTable.id, gigId),
        columns: {
          id: true,
          expiresAt: true,
          statusInternal: true,
        },
        with: {
          buyer: {
            columns: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          worker: {
            columns: {
              id: true,
              fullName: true,
            },
          },
        },
      });

      if (!gig) {
        throw new Error("Gig not found");
      }

      if (gig.expiresAt && new Date(gig.expiresAt) <= new Date()) {
        throw new Error("Gig has expired");
      }

      return gig;
    };

    if (action === "accept" && role === "worker") {
      await validateGigNotExpired();

      await db
        .update(GigsTable)
        .set({
          statusInternal: newStatus,
          workerUserId: user.id,
          updatedAt: new Date(),
        })
        .where(eq(GigsTable.id, gigId));
    } else if (action === "cancel" && role === "worker") {
      const result = await validateGigNotExpired();

      await db
        .update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(eq(GigsTable.id, gigId));

      const message: admin.messaging.Message = {
        notification: {
          title: `Gig Cancelled by Worker: ${result.worker?.fullName}`,
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
        topic: result.buyer.id,
      };

      await admin.messaging().send(message);
    } else if (action === "complete") {
      await validateGigNotExpired();

      const gigUserIdCondition =
        role === "buyer" ? GigsTable.buyerUserId : GigsTable.workerUserId;

      await db
        .update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(and(eq(GigsTable.id, gigId), eq(gigUserIdCondition, user.id)));
    } else {
      const gigUserIdCondition =
        role === "buyer" ? GigsTable.buyerUserId : GigsTable.workerUserId;

      await db
        .update(GigsTable)
        .set({ statusInternal: newStatus })
        .where(and(eq(GigsTable.id, gigId), eq(gigUserIdCondition, user.id)));
    }

    return { success: true, status: 200 };
  } catch (error: unknown) {
    console.error("Error updating gig:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error updating gig",
      status: 500,
    };
  }
}
