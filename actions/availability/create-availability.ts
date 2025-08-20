"use server";

import { db } from "@/lib/drizzle/db";
import { WorkerAvailabilityTable, UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { CreateWorkerAvailabilityInput, WorkerAvailabilityResponse } from "@/app/types/WorkerAvailabilityTypes";
import { validateAvailability } from "@/lib/utils/availabilityValidation";
import { revalidatePath } from "next/cache";

export async function createWorkerAvailability(input: CreateWorkerAvailabilityInput): Promise<WorkerAvailabilityResponse> {
  try {
    // Find user by firebaseUid
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, input.userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Validate the availability time range and check for overlaps
    const validation = await validateAvailability({
      startTime: input.startTime,
      endTime: input.endTime,
      userId: user.id,
      checkGigConflicts: true
    });

    if (!validation.isValid) {
      return { error: validation.errors.join(", ") };
    }

    // Create the availability record
    const [newAvailability] = await db.insert(WorkerAvailabilityTable).values({
      userId: user.id,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Revalidate calendar pages
    revalidatePath(`/user/${input.userId}/worker/calendar`);
    revalidatePath(`/user/${input.userId}/worker`);

    return {
      success: true,
      availability: {
        id: newAvailability.id,
        userId: input.userId,
        startTime: newAvailability.startTime!,
        endTime: newAvailability.endTime!,
        notes: newAvailability.notes || undefined,
        createdAt: newAvailability.createdAt,
        updatedAt: newAvailability.updatedAt,
      }
    };
  } catch (error) {
    console.error("Error creating worker availability:", error);
    return { error: "Failed to create availability" };
  }
}
