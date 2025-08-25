"use server";

import { db } from "@/lib/drizzle/db";
import { WorkerAvailabilityTable, UsersTable } from "@/lib/drizzle/schema";
import { eq, and } from "drizzle-orm";
import { DeleteWorkerAvailabilityInput, WorkerAvailabilityResponse } from "@/app/types/WorkerAvailabilityTypes";
import { revalidatePath } from "next/cache";

export async function deleteWorkerAvailability(input: DeleteWorkerAvailabilityInput): Promise<WorkerAvailabilityResponse> {
  try {
    // Find user by firebaseUid
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, input.userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Check if the availability exists and belongs to the user
    const existingAvailability = await db.query.WorkerAvailabilityTable.findFirst({
      where: and(
        eq(WorkerAvailabilityTable.id, input.availabilityId),
        eq(WorkerAvailabilityTable.userId, user.id)
      ),
    });

    if (!existingAvailability) {
      return { error: "Availability not found or access denied" };
    }

    // Delete the availability record
    await db.delete(WorkerAvailabilityTable)
      .where(and(
        eq(WorkerAvailabilityTable.id, input.availabilityId),
        eq(WorkerAvailabilityTable.userId, user.id)
      ));

    // Revalidate calendar pages
    revalidatePath(`/user/${input.userId}/worker/calendar`);
    revalidatePath(`/user/${input.userId}/worker`);

    return { success: true };
  } catch (error) {
    console.error("Error deleting worker availability:", error);
    return { error: "Failed to delete availability" };
  }
}
