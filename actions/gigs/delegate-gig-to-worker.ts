"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, GigsTable } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { isUserAuthenticated } from "@/lib/user.server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { createNotificationAction } from "@/actions/notifications/notifications";

export interface DelegateGigInput {
  gigId: string;
  newWorkerId: string;
  reason?: string;
}

export async function delegateGigToWorker(
  token: string,
  input: DelegateGigInput
) {
  try {
    // Authenticate user
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    // Get user details
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      columns: { id: true, fullName: true }
    });

    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    // Get gig details
    const gig = await db.query.GigsTable.findFirst({
      where: eq(GigsTable.id, input.gigId),
      columns: {
        id: true,
        buyerUserId: true,
        workerUserId: true,
        statusInternal: true,
        titleInternal: true,
        agreedRate: true,
        startTime: true,
        endTime: true,
        exactLocation: true
      }
    });

    if (!gig) {
      return { error: 'Gig not found', status: 404 };
    }

    // Verify user is the buyer of this gig
    if (gig.buyerUserId !== user.id) {
      return { error: 'Unauthorized to delegate this gig', status: 403 };
    }

    // Check if gig is in a state that allows delegation
    const allowedStatuses = ['ACCEPTED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(gig.statusInternal)) {
      return { 
        error: `Cannot delegate gig with status: ${gig.statusInternal}`, 
        status: 400 
      };
    }

    // Get new worker details
    const newWorker = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, input.newWorkerId),
      columns: { id: true, fullName: true, firebaseUid: true }
    });

    if (!newWorker) {
      return { error: 'New worker not found', status: 404 };
    }

    // Get current worker details for notification
    const currentWorker = gig.workerUserId ? await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, gig.workerUserId),
      columns: { id: true, fullName: true, firebaseUid: true }
    }) : null;

    // Update gig with new worker
    await db
      .update(GigsTable)
      .set({ 
        workerUserId: input.newWorkerId,
        statusInternal: 'ACCEPTED' // Reset to accepted status for new worker
      })
      .where(eq(GigsTable.id, input.gigId));

    // Send notification to new worker
    if (newWorker.firebaseUid) {
      await createNotificationAction({
        userUid: newWorker.firebaseUid,
        type: 'gigAssignment',
        title: '🎯 Gig Delegated to You',
        body: `${user.fullName} has delegated "${gig.titleInternal}" to you. Check your dashboard for details.`,
        image: '/images/gig-delegated.png',
        path: `/user/${newWorker.id}/worker/gigs/${input.gigId}`,
        status: 'unread'
      }, token);
    }

    // Send notification to current worker (if they exist)
    if (currentWorker?.firebaseUid) {
      await createNotificationAction({
        userUid: currentWorker.firebaseUid,
        type: 'gigUpdate',
        title: '⚠️ Gig Delegated Away',
        body: `The gig "${gig.titleInternal}" has been delegated to another worker.`,
        image: '/images/gig-delegated-away.png',
        path: `/user/${currentWorker.id}/worker`,
        status: 'unread'
      }, token);
    }

    return { 
      success: true, 
      message: 'Gig successfully delegated',
      data: {
        gigId: input.gigId,
        newWorkerId: input.newWorkerId,
        newWorkerName: newWorker.fullName,
        previousWorkerId: gig.workerUserId,
        previousWorkerName: currentWorker?.fullName
      }
    };

  } catch (error: any) {
    console.error('Error delegating gig:', error);
    return { 
      error: error.message || 'Failed to delegate gig', 
      status: 500 
    };
  }
}
