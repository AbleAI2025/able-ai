"use server";

import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import { MOCK_EVENTS } from '@/app/(web-client)/user/[userId]/worker/calendar/mockData';
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import { CalendarEvent, EventStatusEnum, EventStatusEnumType } from "@/app/types/CalendarEventTypes";

const mapEventStatus = (status: string): EventStatusEnumType => {
  const [
    PENDING_WORKER_ACCEPTANCE,
    ACCEPTED,
    DECLINED_BY_WORKER,
    IN_PROGRESS,
    PENDING_COMPLETION_WORKER,
    PENDING_COMPLETION_BUYER,
    COMPLETED,
    AWAITING_PAYMENT,
    PAID,
    CANCELLED_BY_BUYER,
    CANCELLED_BY_WORKER,
    CANCELLED_BY_ADMIN,
    DISPUTED,
  ] = gigStatusEnum.enumValues;

  
  const mappedStatus: Record<string, EventStatusEnumType> = {
    [PENDING_WORKER_ACCEPTANCE]: EventStatusEnum.PENDING,
    [ACCEPTED]: EventStatusEnum.ACCEPTED,
    [DECLINED_BY_WORKER]: EventStatusEnum.UNAVAILABLE,
    [IN_PROGRESS]: EventStatusEnum.IN_PROGRESS,
    [PENDING_COMPLETION_WORKER]: EventStatusEnum.PENDING,
    [PENDING_COMPLETION_BUYER]: EventStatusEnum.PENDING,
    [COMPLETED]: EventStatusEnum.COMPLETED,
    [AWAITING_PAYMENT]: EventStatusEnum.COMPLETED,
    [PAID]: EventStatusEnum.COMPLETED,
    [CANCELLED_BY_BUYER]: EventStatusEnum.CANCELLED,
    [CANCELLED_BY_WORKER]: EventStatusEnum.CANCELLED,
    [CANCELLED_BY_ADMIN]: EventStatusEnum.CANCELLED,
    [DISPUTED]: EventStatusEnum.OFFER,
  };

  return mappedStatus[status] || EventStatusEnum.UNAVAILABLE;
};

export async function getCalendarEvents({ userId, role, isViewQA }: { userId: string; role?: 'buyer' | 'worker'; isViewQA?: boolean; }) {

  if (isViewQA) return { events: MOCK_EVENTS };

  if (!userId) {
    return { error: 'User id is required', events: [], status: 404 };
  }

  try {

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });


    if (!user) {
      return { error: 'User not found', events: [], status: 404 };
    }

    const columnConditionId = role === 'buyer' ? GigsTable.buyerUserId : GigsTable.workerUserId;
    const gigs = await db.query.GigsTable.findMany({
      where: eq(columnConditionId, user.id),
      with: {
        buyer: {
          columns: {
            id: true,
            fullName: true,
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

    const calendarEvents: CalendarEvent[] = gigs.map((gig) => {
      const isMyGig = gig.buyerUserId === user.id || gig.workerUserId === user.id;
      // const isMyGigAsBuyer = gig.buyerUserId === user.id;
      const isBuyerAccepted = gig.statusInternal === 'ACCEPTED';
      const displayStatus = mapEventStatus(gig.statusInternal)

      return {
        id: gig.id,
        title: gig.titleInternal,
        start: gig.startTime,
        end: gig.endTime,
        allDay: !(gig.startTime && gig.endTime),
        status: displayStatus,
        eventType: 'gig',
        buyerName: gig.buyer?.fullName || 'Unknown Buyer',
        workerName: gig.worker?.fullName || 'Unassigned Worker',
        isMyGig: isMyGig,
        isBuyerAccepted: isBuyerAccepted,
        resource: {
          gigId: gig.id,
          buyerId: gig.buyerUserId,
          workerId: gig.workerUserId,
          agreedRate: gig.agreedRate,
          totalAgreedPrice: gig.totalAgreedPrice,
          moderationStatus: gig.moderationStatus,
        },
      };
    });

    return { events: calendarEvents };

  } catch (error: any) {
    console.error("Error registering user:", error);
    return { error: error.message, events: [], status: 500 };
  }
}
