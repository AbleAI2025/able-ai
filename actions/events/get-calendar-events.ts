"use server";

import { db } from "@/lib/drizzle/db";
import { eq, and, isNull, ne } from "drizzle-orm";
import {
  GigsTable,
  UsersTable,
  WorkerAvailabilityTable,
} from "@/lib/drizzle/schema";
import {
  CalendarEvent,
  EventStatusEnum,
  EventStatusEnumType,
} from "@/app/types/CalendarEventTypes";

const mapEventStatus = (status: string): EventStatusEnumType => {
  const mappedStatus: Record<string, EventStatusEnumType> = {
    PENDING_WORKER_ACCEPTANCE: EventStatusEnum.OFFER,
    ACCEPTED: EventStatusEnum.ACCEPTED,
    DECLINED_BY_WORKER: EventStatusEnum.UNAVAILABLE,
    IN_PROGRESS: EventStatusEnum.IN_PROGRESS,
    PENDING_COMPLETION_WORKER: EventStatusEnum.PENDING,
    PENDING_COMPLETION_BUYER: EventStatusEnum.PENDING,
    COMPLETED: EventStatusEnum.COMPLETED,
    AWAITING_PAYMENT: EventStatusEnum.COMPLETED,
    PAID: EventStatusEnum.COMPLETED,
    CANCELLED_BY_BUYER: EventStatusEnum.CANCELLED,
    CANCELLED_BY_WORKER: EventStatusEnum.UNAVAILABLE,
    CANCELLED_BY_ADMIN: EventStatusEnum.CANCELLED,
    DISPUTED: EventStatusEnum.OFFER,
  };
  return mappedStatus[status] || EventStatusEnum.UNAVAILABLE;
};

// --- Worker Events Helper ---
async function getWorkerCalendarEvents(user: typeof UsersTable.$inferSelect): Promise<CalendarEvent[]> {
  // 1. Accepted/assigned gigs
  const acceptedGigs = await db.query.GigsTable.findMany({
    where: eq(GigsTable.workerUserId, user.id),
    with: {
      buyer: { columns: { id: true, fullName: true } },
      worker: { columns: { id: true, fullName: true } },
    },
  });

  const availableOffers = await db.query.GigsTable.findMany({
    where: and(
      eq(GigsTable.statusInternal, "PENDING_WORKER_ACCEPTANCE"),
      isNull(GigsTable.workerUserId),
      ne(GigsTable.buyerUserId, user.id)
    ),
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
    },
  });

  // 3. Worker availability
  const workerAvailability = await db.query.WorkerAvailabilityTable.findMany({
    where: eq(WorkerAvailabilityTable.userId, user.id),
    orderBy: WorkerAvailabilityTable.startTime,
  });

  // Map accepted gigs
  const acceptedEvents: CalendarEvent[] = acceptedGigs.map((gig) => ({
    id: gig.id,
    title: gig.titleInternal,
    start: new Date(gig.startTime),
    end: new Date(gig.endTime),
    allDay: !(gig.startTime && gig.endTime),
    status: mapEventStatus(gig.statusInternal),
    eventType: "gig",
    buyerName: gig.buyer?.fullName || "Unknown Buyer",
    workerName: gig.worker?.fullName || "Unassigned Worker",
    isMyGig: true,
    isBuyerAccepted: gig.statusInternal === "ACCEPTED",
    location:
      (gig.addressJson as any)?.formatted_address ||
      gig.exactLocation ||
      "Location not specified",
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
  }));

  // Map available offers
  const offerEvents: CalendarEvent[] = availableOffers.map((gig) => ({
    id: gig.id,
    title: `🎯 ${gig.titleInternal} (Offer)`,
    start: new Date(gig.startTime),
    end: new Date(gig.endTime),
    allDay: !(gig.startTime && gig.endTime),
    status: EventStatusEnum.OFFER,
    eventType: "offer",
    buyerName: "Available Gig",
    workerName: "Available for you",
    isMyGig: false,
    isBuyerAccepted: false,
    location:
      (gig.addressJson as any)?.formatted_address ||
      gig.exactLocation ||
      "Location not specified",
    description: gig.fullDescription || undefined,
    resource: {
      gigId: gig.id,
      buyerId: gig.buyerUserId,
      workerId: null,
      agreedRate: gig.agreedRate,
      totalAgreedPrice: ((new Date(gig.endTime).getTime() - new Date(gig.startTime).getTime()) / 3600000) * Number(gig.agreedRate),
      moderationStatus: "PENDING",
      isOffer: true,
      notesForWorker: gig.notesForWorker,
    },
  }));

  // Map worker availability
  const availabilityEvents: CalendarEvent[] = workerAvailability
    .filter((availability) => availability.startTime && availability.endTime)
    .map((availability) => ({
      id: availability.id,
      title: availability.notes
        ? `Unavailable: ${availability.notes}`
        : "Unavailable",
      start: new Date(availability.startTime!),
      end: new Date(availability.endTime!),
      allDay: false,
      status: EventStatusEnum.UNAVAILABLE,
      eventType: "unavailability",
      buyerName: "Unavailable",
      workerName: "You",
      isMyGig: true,
      isBuyerAccepted: false,
      location: availability.notes || "Unavailable period",
      description: availability.notes || undefined,
      resource: {
        availabilityId: availability.id,
        userId: user.id,
      },
    }));

  return [...acceptedEvents, ...offerEvents, ...availabilityEvents];
}

// --- Buyer Events Helper ---
async function getBuyerCalendarEvents(user: typeof UsersTable.$inferSelect): Promise<CalendarEvent[]> {
  const gigs = await db.query.GigsTable.findMany({
    where: eq(GigsTable.buyerUserId, user.id),
    with: {
      buyer: { columns: { id: true, fullName: true } },
      worker: { columns: { id: true, fullName: true } },
    },
  });

  return gigs.map((gig) => ({
    id: gig.id,
    title: gig.titleInternal,
    start: new Date(gig.startTime),
    end: new Date(gig.endTime),
    allDay: !(gig.startTime && gig.endTime),
    status: mapEventStatus(gig.statusInternal),
    eventType: "gig",
    buyerName: gig.buyer?.fullName || "Unknown Buyer",
    workerName: gig.worker?.fullName || "Unassigned Worker",
    isMyGig: gig.buyerUserId === user.id || gig.workerUserId === user.id,
    isBuyerAccepted: gig.statusInternal === "ACCEPTED",
    location:
      (gig.addressJson as any)?.formatted_address ||
      gig.exactLocation ||
      "Location not specified",
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
  }));
}

// --- Main Function ---
export async function getCalendarEvents({
  userId,
  role,
  isViewQA,
}: {
  userId: string;
  role?: "buyer" | "worker";
  isViewQA?: boolean;
}) {
  if (!userId) {
    return { error: "User id is required", events: [], status: 404 };
  }

  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found", events: [], status: 404 };
    }

    let calendarEvents: CalendarEvent[] = [];

    if (role === "worker") {
      calendarEvents = await getWorkerCalendarEvents(user);
    } else {
      calendarEvents = await getBuyerCalendarEvents(user);
    }

    return { events: calendarEvents };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching events:", error.message);
      return { error: error.message, events: [], status: 500 };
    } else {
      console.error("Unexpected error fetching events:", error);
      return { error: "Unexpected error", events: [], status: 500 };
    }
  }
}
