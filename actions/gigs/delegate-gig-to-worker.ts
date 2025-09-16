"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable, GigsTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
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

    // Verify user is either the buyer or the assigned worker of this gig
    if (gig.buyerUserId !== user.id && gig.workerUserId !== user.id) {
      return { error: 'Unauthorized to delegate this gig', status: 403 };
    }

    // Check if gig is in a state that allows delegation
    const allowedStatuses = ['PENDING_WORKER_ACCEPTANCE', 'ACCEPTED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(gig.statusInternal)) {
      return { 
        error: `Cannot delegate gig with status: ${gig.statusInternal}`, 
        status: 400 
      };
    }

    // Get new worker details
    console.log('🔍 DEBUG: Looking for new worker with ID:', input.newWorkerId);
    const newWorker = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, input.newWorkerId),
      columns: { id: true, fullName: true, firebaseUid: true },
      with: {
        gigWorkerProfile: {
          columns: { id: true }
        }
      }
    });

    console.log('🔍 DEBUG: New worker found:', {
      found: !!newWorker,
      userId: newWorker?.id,
      fullName: newWorker?.fullName,
      firebaseUid: newWorker?.firebaseUid,
      hasWorkerProfile: !!newWorker?.gigWorkerProfile,
      workerProfileId: newWorker?.gigWorkerProfile?.id
    });

    if (!newWorker) {
      return { error: 'New worker not found', status: 404 };
    }

    // Get current worker details for notification
    const currentWorker = gig.workerUserId ? await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, gig.workerUserId),
      columns: { id: true, fullName: true, firebaseUid: true },
      with: {
        gigWorkerProfile: {
          columns: { id: true }
        }
      }
    }) : null;

    // Update gig - set workerUserId to null and status to pending so new worker needs to accept
    await db
      .update(GigsTable)
      .set({ 
        workerUserId: null, // Set to null so gig becomes available for new worker to accept
        statusInternal: 'PENDING_WORKER_ACCEPTANCE' // Set to pending so new worker needs to accept
      })
      .where(eq(GigsTable.id, input.gigId));

    // Send notification to new worker
    console.log('🔍 DEBUG: Notification check:', {
      hasFirebaseUid: !!newWorker.firebaseUid,
      hasWorkerProfile: !!newWorker.gigWorkerProfile?.id,
      workerProfileId: newWorker.gigWorkerProfile?.id,
      notificationPath: newWorker.gigWorkerProfile?.id ? `/user/${newWorker.gigWorkerProfile.id}/worker/gigs/${input.gigId}` : 'NO_PROFILE'
    });

    if (newWorker.firebaseUid && newWorker.gigWorkerProfile?.id) {
      console.log('🔍 DEBUG: Creating notification for new worker');
      await createNotificationAction({
        userUid: newWorker.firebaseUid,
        type: 'gigAssignment',
        title: '🎯 Gig Delegated to You',
        body: `${user.fullName} has delegated you for this gig!`,
        image: '/images/gig-delegated.png',
        path: `/user/${newWorker.gigWorkerProfile.id}/worker/gigs/${input.gigId}`,
        status: 'unread'
      }, token);
      console.log('🔍 DEBUG: Notification created successfully');
    } else {
      console.log('🔍 DEBUG: Cannot create notification - missing Firebase UID or worker profile');
    }

    // Send notification to current worker (if they exist)
    if (currentWorker?.firebaseUid) {
      // Determine if current worker is the buyer or a worker
      const isCurrentWorkerTheBuyer = gig.buyerUserId === currentWorker.id;
      
      let notificationPath;
      if (isCurrentWorkerTheBuyer) {
        // If current worker is the buyer, route to buyer gig details
        notificationPath = `/user/${currentWorker.id}/buyer/gigs/${input.gigId}`;
      } else if (currentWorker.gigWorkerProfile?.id) {
        // If current worker is actually a worker, route to worker page
        notificationPath = `/user/${currentWorker.gigWorkerProfile.id}/worker`;
      } else {
        // Fallback to user ID
        notificationPath = `/user/${currentWorker.id}`;
      }
      
      await createNotificationAction({
        userUid: currentWorker.firebaseUid,
        type: 'gigUpdate',
        title: '⚠️ Gig Delegated Away',
        body: `The gig "${gig.titleInternal}" has been delegated to another worker.`,
        image: '/images/gig-delegated-away.png',
        path: notificationPath,
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
