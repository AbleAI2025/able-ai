"use server";

import { db } from "@/lib/drizzle/db";
import { and, eq, isNull, or } from "drizzle-orm";
import { GigsTable, GigWorkerProfilesTable, UsersTable } from "@/lib/drizzle/schema";
import moment from "moment";
import GigDetails from "@/app/types/GigDetailsTypes";

function getMappedStatus(internalStatus: string): GigDetails['status'] {

  switch (internalStatus) {
    case 'PENDING_WORKER_ACCEPTANCE':
      return 'PENDING';
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED_BY_BUYER':
    case 'CANCELLED_BY_WORKER':
    case 'CANCELLED_BY_ADMIN':
      return 'CANCELLED';
    default:
      return 'PENDING';
  }

}

export async function getGigDetails({
  gigId,
  userId,
  role,
}: { 
  gigId: string; 
  userId: string; 
  role?: 'buyer' | 'worker'; 
  isViewQA?: boolean; 
}) {
  if (!userId) {
    return { error: 'User id is required', gig: {} as GigDetails, status: 404 };
  }

  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
      columns: {
        id: true,
      }
    });

    if (!user) {
      return { error: 'User is not found', gig: {} as GigDetails, status: 404 };
    }

    let gig;

    if (role === 'buyer') {
      gig = await db.query.GigsTable.findFirst({
        where: and(eq(GigsTable.buyerUserId, user.id), eq(GigsTable.id, gigId)),
        with: {
          buyer: { columns: { id: true, fullName: true, email: true } },
          worker: { columns: { id: true, fullName: true } },
        },
      });
    } else {
      gig = await db.query.GigsTable.findFirst({
        where: and(
          eq(GigsTable.id, gigId),
          or(
            eq(GigsTable.workerUserId, user.id),
            and(
              eq(GigsTable.statusInternal, 'PENDING_WORKER_ACCEPTANCE'),
              isNull(GigsTable.workerUserId)
            )
          )
        ),
        with: {
          buyer: { columns: { id: true, fullName: true, email: true } },
          worker: { columns: { id: true, fullName: true } },
        },
      });
    }

    const worker = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, gig?.worker?.id || ""),
    })

    if (!gig) {
      return { error: 'gig not found', gig: {} as GigDetails, status: 404 };
    }

    const startDate = moment(gig.startTime);
    const endDate = moment(gig.endTime);
    const durationInHours = endDate.diff(startDate, 'hours', true);
    const estimatedEarnings = gig.totalAgreedPrice ? parseFloat(gig.totalAgreedPrice) : 0;
    const hourlyRate = gig.agreedRate ? parseFloat(gig.agreedRate) : 0;
    const isWorkerSubmittedFeedback = false;
    const isBuyerSubmittedFeedback = false;

    // Parse location using helper function
    const roleDisplay = gig.titleInternal || 'Gig Worker';

    const gigDetails: GigDetails = {
      id: gig.id,
      role: roleDisplay,
      gigTitle: gig.titleInternal || 'Untitled Gig',
      buyerName: gig.buyer?.fullName || 'Unknown',
      date: startDate.format('YYYY-MM-DD'),
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration: `${durationInHours} hours`,
      location: gig?.addressJson || undefined,
      workerViderUrl: worker?.videoUrl,
      workerFullBio: worker?.fullBio,
      hourlyRate: hourlyRate,
      worker: gig?.worker,
      estimatedEarnings: estimatedEarnings,
      specialInstructions: gig.notesForWorker || undefined,
      status: getMappedStatus(gig.statusInternal),
      statusInternal: gig.statusInternal,
      hiringManager: gig.buyer?.fullName || 'Manager',
      hiringManagerUsername: gig.buyer?.email || 'No email',
      isWorkerSubmittedFeedback: isWorkerSubmittedFeedback,
      isBuyerSubmittedFeedback: isBuyerSubmittedFeedback,
    };

    return { success: true, gig: gigDetails, status: 200 };

  } catch (error: unknown) {
    console.error("Error fetching gig:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error fetching gig', gig: {} as GigDetails, status: 500 };
  }
}
