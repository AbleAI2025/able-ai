"use server";

import { db } from "@/lib/drizzle/db";
import { WorkerAvailabilityTable, UsersTable } from "@/lib/drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { ListWorkerAvailabilityInput, WorkerAvailabilityResponse } from "@/app/types/WorkerAvailabilityTypes";

export async function listWorkerAvailability(input: ListWorkerAvailabilityInput): Promise<WorkerAvailabilityResponse> {
  try {
    // Find user by firebaseUid
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, input.userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Build query conditions
    const conditions = [eq(WorkerAvailabilityTable.userId, user.id)];

    // Add date range filters if provided
    if (input.startDate) {
      conditions.push(gte(WorkerAvailabilityTable.startTime, input.startDate));
    }
    if (input.endDate) {
      conditions.push(lte(WorkerAvailabilityTable.endTime, input.endDate));
    }

    // Fetch availability records
    const availabilities = await db.query.WorkerAvailabilityTable.findMany({
      where: and(...conditions),
      orderBy: WorkerAvailabilityTable.startTime,
    });

    // Map to response format
    const mappedAvailabilities = availabilities.map(availability => ({
      id: availability.id,
      userId: input.userId,
      startTime: availability.startTime!,
      endTime: availability.endTime!,
      notes: availability.notes || undefined,
      createdAt: availability.createdAt,
      updatedAt: availability.updatedAt,
    }));

    return {
      success: true,
      availabilities: mappedAvailabilities,
    };
  } catch (error) {
    console.error("Error listing worker availability:", error);
    return { error: "Failed to list availability" };
  }
}
