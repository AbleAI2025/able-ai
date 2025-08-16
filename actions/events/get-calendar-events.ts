"use server";

import { db } from "@/lib/drizzle/db";
import { eq, and, ne, isNull } from "drizzle-orm";
import { MOCK_EVENTS } from '@/app/(web-client)/user/[userId]/worker/calendar/mockData';
import { BUYER_MOCK_EVENTS } from '@/app/(web-client)/user/[userId]/buyer/calendar/mockData';
import { GigsTable, gigStatusEnum, UsersTable } from "@/lib/drizzle/schema";
import { CalendarEvent, EventStatusEnum, EventStatusEnumType } from "@/app/types/CalendarEventTypes";

const mapEventStatus = (status: string): EventStatusEnumType => {
  // Use the actual string values directly instead of relying on enum array order
  const mappedStatus: Record<string, EventStatusEnumType> = {
    'PENDING_WORKER_ACCEPTANCE': EventStatusEnum.OFFER,
    'ACCEPTED': EventStatusEnum.ACCEPTED,
    'DECLINED_BY_WORKER': EventStatusEnum.UNAVAILABLE,
    'IN_PROGRESS': EventStatusEnum.IN_PROGRESS,
    'PENDING_COMPLETION_WORKER': EventStatusEnum.PENDING,
    'PENDING_COMPLETION_BUYER': EventStatusEnum.PENDING,
    'COMPLETED': EventStatusEnum.COMPLETED,
    'AWAITING_PAYMENT': EventStatusEnum.COMPLETED,
    'PAID': EventStatusEnum.COMPLETED,
    'CANCELLED_BY_BUYER': EventStatusEnum.CANCELLED,
    'CANCELLED_BY_WORKER': EventStatusEnum.UNAVAILABLE,
    'CANCELLED_BY_ADMIN': EventStatusEnum.CANCELLED,
    'DISPUTED': EventStatusEnum.OFFER,
  };

  return mappedStatus[status] || EventStatusEnum.UNAVAILABLE;
};

export async function getCalendarEvents({ userId, role, isViewQA }: { userId: string; role?: 'buyer' | 'worker'; isViewQA?: boolean; }) {

  // Only use mock data for QA testing, not for real users
  if (isViewQA && process.env.NODE_ENV === 'development') {
    return { events: role === 'buyer' ? BUYER_MOCK_EVENTS : MOCK_EVENTS };
  }

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

    let calendarEvents: CalendarEvent[] = [];

    if (role === 'worker') {
      // For workers: get both their accepted gigs AND available gig offers
      
      // Test basic database connectivity
      try {
        await db.query.UsersTable.findFirst({
          columns: { id: true }
        });
      } catch (error) {
        return { error: 'Database connection failed', events: [], status: 500 };
      }
      
      // First, let's check what gigs exist at all in the database
      const allGigs = await db.query.GigsTable.findMany({
        columns: {
          id: true,
          titleInternal: true,
          statusInternal: true,
          workerUserId: true,
          buyerUserId: true
        }
      });
      
      // 1. Get accepted/assigned gigs
      const acceptedGigs = await db.query.GigsTable.findMany({
        where: eq(GigsTable.workerUserId, user.id),
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

      // 2. Get available gig offers (pending worker acceptance, no worker assigned)
      // Use the same approach as getWorkerOffers - fetch all gigs and filter in memory
      const allGigsForOffers = await db.query.GigsTable.findMany({
        columns: {
          id: true,
          titleInternal: true,
          statusInternal: true,
          workerUserId: true,
          buyerUserId: true,
          startTime: true,
          endTime: true,
          agreedRate: true,
          fullDescription: true,
          notesForWorker: true,
          addressJson: true,
          exactLocation: true,
        }
      });
      
      // Filter for offers using the same logic as getWorkerOffers
      const availableOffers = allGigsForOffers.filter(gig => 
        gig.statusInternal === 'PENDING_WORKER_ACCEPTANCE' &&
        !gig.workerUserId &&
        gig.buyerUserId !== user.id
      );
      
      // Keep the original query for comparison/debugging
      const allPendingGigs = await db.query.GigsTable.findMany({
        where: eq(GigsTable.statusInternal, 'PENDING_WORKER_ACCEPTANCE'),
        columns: {
          id: true,
          titleInternal: true,
          workerUserId: true,
          buyerUserId: true
        }
      });
      
      // Original complex query for comparison
      const originalQueryOffers = await db.query.GigsTable.findMany({
        where: and(
          eq(GigsTable.statusInternal, 'PENDING_WORKER_ACCEPTANCE'),
          isNull(GigsTable.workerUserId)
        ),
        with: {
          buyer: {
            columns: {
              id: true,
              fullName: true,
            },
          },
        },
      });
      
      // Debug: Check if we're getting the expected offers
      if (availableOffers.length === 0) {
        // Let's check what gigs exist with PENDING_WORKER_ACCEPTANCE status
        const pendingGigs = await db.query.GigsTable.findMany({
          where: eq(GigsTable.statusInternal, 'PENDING_WORKER_ACCEPTANCE'),
          columns: {
            id: true,
            titleInternal: true,
            workerUserId: true,
            buyerUserId: true
          }
        });
        
        // Check how many have no worker assigned
        const unassignedGigs = pendingGigs.filter(g => !g.workerUserId);
        
        // If no gigs exist at all, this might be a new database
        if (allGigs.length === 0) {
          // Database appears to be empty
        }
      }

      // Map accepted gigs
      const acceptedEvents: CalendarEvent[] = acceptedGigs.map((gig) => {
        const displayStatus = mapEventStatus(gig.statusInternal);
        return {
          id: gig.id,
          title: gig.titleInternal,
          start: new Date(gig.startTime),
          end: new Date(gig.endTime),
          allDay: !(gig.startTime && gig.endTime),
          status: displayStatus,
          eventType: 'gig',
          buyerName: gig.buyer?.fullName || 'Unknown Buyer',
          workerName: gig.worker?.fullName || 'Unassigned Worker',
          isMyGig: true,
          isBuyerAccepted: gig.statusInternal === 'ACCEPTED',
          location: (gig.addressJson as any)?.formatted_address || gig.exactLocation || 'Location not specified',
          description: gig.fullDescription || undefined,
          resource: {
            gigId: gig.id,
            buyerId: gig.buyerUserId,
            workerId: gig.workerUserId,
            agreedRate: gig.agreedRate,
            totalAgreedPrice: gig.totalAgreedPrice,
            moderationStatus: gig.moderationStatus,
            isOffer: false,
          },
        };
      });

      // Map available offers
      const offerEvents: CalendarEvent[] = availableOffers.map((gig) => {
        return {
          id: gig.id,
          title: `🎯 ${gig.titleInternal} (Offer)`,
          start: new Date(gig.startTime),
          end: new Date(gig.endTime),
          allDay: !(gig.startTime && gig.endTime),
          status: EventStatusEnum.OFFER,
          eventType: 'offer',
          buyerName: 'Available Gig', // Since we don't have buyer relation loaded
          workerName: 'Available for you',
          isMyGig: false,
          isBuyerAccepted: false,
          location: (gig.addressJson as any)?.formatted_address || gig.exactLocation || 'Location not specified',
          description: gig.fullDescription || undefined,
          resource: {
            gigId: gig.id,
            buyerId: gig.buyerUserId,
            workerId: null,
            agreedRate: gig.agreedRate,
            totalAgreedPrice: gig.agreedRate, // Use agreedRate since totalAgreedPrice might not be loaded
            moderationStatus: 'PENDING', // Default since not loaded
            isOffer: true,
            notesForWorker: gig.notesForWorker,
          },
        };
      });

      calendarEvents = [...acceptedEvents, ...offerEvents];
    } else {
      // For buyers: get their created gigs (existing logic)
      const columnConditionId = GigsTable.buyerUserId;
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

      calendarEvents = gigs.map((gig) => {
        const isMyGig = gig.buyerUserId === user.id || gig.workerUserId === user.id;
        const isBuyerAccepted = gig.statusInternal === 'ACCEPTED';
        const displayStatus = mapEventStatus(gig.statusInternal)

        return {
          id: gig.id,
          title: gig.titleInternal,
          start: new Date(gig.startTime),
          end: new Date(gig.endTime),
          allDay: !(gig.startTime && gig.endTime),
          status: displayStatus,
          eventType: 'gig',
          buyerName: gig.buyer?.fullName || 'Unknown Buyer',
          workerName: gig.worker?.fullName || 'Unassigned Worker',
          isMyGig: isMyGig,
          isBuyerAccepted: isBuyerAccepted,
          location: (gig.addressJson as any)?.formatted_address || gig.exactLocation || 'Location not specified',
          description: gig.fullDescription || undefined,
          resource: {
            gigId: gig.id,
            buyerId: gig.buyerUserId,
            workerId: gig.workerUserId,
            agreedRate: gig.agreedRate,
            totalAgreedPrice: gig.totalAgreedPrice,
            moderationStatus: gig.moderationStatus,
            isOffer: false,
          },
        };
      });
    }

    return { events: calendarEvents };

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching events:", error.message);
      return { error: error.message, events: [], status: 500 };
    } else {
      console.error("Unexpected error fetching events:", error);
      return { error: 'Unexpected error', events: [], status: 500 };
    }
  }
}
