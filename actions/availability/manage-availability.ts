"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { WorkerAvailabilityTable } from "@/lib/drizzle/schema/availability";
import { eq } from "drizzle-orm";
import {
  AvailabilitySlot,
  AvailabilityFormData,
} from "@/app/types/AvailabilityTypes";
import { revalidatePath } from "next/cache";

export async function getWorkerAvailability(
  userId: string,
  isViewQA: boolean = false
): Promise<{ availability: AvailabilitySlot[]; error?: string }> {
  if (isViewQA) {
    return {
      availability: [
        {
          id: "mock-1",
          startTime: "09:00",
          endTime: "12:00",
          days: ["Monday", "Wednesday"],
          frequency: "weekly",
          ends: "never",
          startDate: "2025-09-01",
          endDate: undefined,
          occurrences: undefined,
          notes: "Morning slots",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "mock-2",
          startTime: "14:00",
          endTime: "18:00",
          days: ["Friday"],
          frequency: "weekly",
          ends: "never",
          startDate: "2025-09-01",
          endDate: undefined,
          occurrences: undefined,
          notes: "Afternoon slots",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };
  }
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      console.log("getWorkerAvailability: User not found for userId:", userId);
      return { error: "User not found", availability: [] };
    }

    // Use the WorkerAvailabilityTable instead of GigWorkerProfilesTable
    const availabilitySlots = await db.query.WorkerAvailabilityTable.findMany({
      where: eq(WorkerAvailabilityTable.userId, user.id),
    });

    console.log(
      "getWorkerAvailability: availabilitySlots from WorkerAvailabilityTable:",
      availabilitySlots
    );

    // Convert the database records to AvailabilitySlot format
    const availability: AvailabilitySlot[] = availabilitySlots.map((slot) => ({
      id: slot.id,
      startTime: slot.startTimeStr || "09:00",
      endTime: slot.endTimeStr || "17:00",
      days: (slot.days as string[]) || [],
      frequency: (slot.frequency || "never") as
        | "never"
        | "weekly"
        | "biweekly"
        | "monthly",
      ends: (slot.ends || "never") as "never" | "on_date" | "after_occurrences",
      startDate: slot.startDate || undefined,
      endDate: slot.endDate || undefined,
      occurrences: slot.occurrences || undefined,
      notes: slot.notes || undefined,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));

    console.log("getWorkerAvailability: converted availability:", availability);

    return { availability };
  } catch (error) {
    console.error("Error fetching availability:", error);
    return { error: "Failed to fetch availability", availability: [] };
  }
}

const createTimestamp = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export async function createAvailabilitySlot(userId: string, data: AvailabilityFormData) {
  try {
    // Validate required fields
    if (
      !data.startTime ||
      !data.endTime ||
      !data.days ||
      !data.frequency ||
      !data.ends
    ) {
      console.error("createAvailabilitySlot: Missing required fields:", {
        startTime: !!data.startTime,
        endTime: !!data.endTime,
        days: !!data.days,
        frequency: !!data.frequency,
        ends: !!data.ends,
      });
      throw new Error("Missing required fields");
    }

    // Validate data types
    if (!Array.isArray(data.days)) throw new Error("Days must be an array");

    if (data.frequency !== "never" && data.days.length === 0)
      throw new Error(
        "At least one day must be selected when frequency is recurring"
      );

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) throw new Error("User not found");

    // Create proper timestamps for the required fields
    const newSlot = await db
      .insert(WorkerAvailabilityTable)
      .values({
        userId: user.id,
        days: data.days,
        frequency: data.frequency as
          | "never"
          | "weekly"
          | "biweekly"
          | "monthly",
        startDate: data?.startDate,
        startTimeStr: data.startTime,
        endTimeStr: data.endTime,
        // Convert time strings to timestamp for the required fields
        startTime: createTimestamp(data.startTime),
        endTime: createTimestamp(data.endTime),
        ends: data.ends,
        occurrences: data?.occurrences,
        endDate: data?.endDate || null,
        notes: data?.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Error creating availability slot:", error);
    return {
      error: "Failed to create availability slot",
      details: error instanceof Error ? error.message : "Unknown error",
      errorType: "general_error",
    };
  }
}

export async function updateAvailabilitySlot(
  userId: string,
  slotId: string,
  data: AvailabilityFormData
) {
  try {
    // Validate required fields
    if (!data.startTime || !data.endTime)
      throw new Error("Missing required time fields");

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) throw new Error("User not found");

    // Validate that the slot exists and belongs to the user
    const existingSlot = await db.query.WorkerAvailabilityTable.findFirst({
      where: eq(WorkerAvailabilityTable.id, slotId),
    });

    if (!existingSlot) throw new Error("Availability slot not found");

    if (existingSlot.userId !== user.id) throw new Error("Access denied");

    // Create proper timestamps for the required fields
    const createTimestamp = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(":").map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    // Prepare update data
    const updateData: any = {
      days: data.days,
      frequency: data.frequency as "never" | "weekly" | "biweekly" | "monthly",
      startDate: data.startDate,
      startTimeStr: data.startTime,
      endTimeStr: data.endTime,
      // Convert time strings to timestamp for the required fields
      startTime: createTimestamp(data.startTime),
      endTime: createTimestamp(data.endTime),
      ends: data.ends,
      occurrences: data.occurrences,
      endDate: data.endDate || null,
      notes: data.notes,
      updatedAt: new Date(),
    };

    // Update the slot in WorkerAvailabilityTable
    const [updatedSlot] = await db
      .update(WorkerAvailabilityTable)
      .set(updateData)
      .where(eq(WorkerAvailabilityTable.id, slotId))
      .returning();

    if (!updatedSlot) throw new Error("Failed to update availability slot");

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true, slot: updatedSlot };
  } catch (error) {
    console.error("Error updating availability slot:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });
    return {
      error: "Failed to update availability slot",
      details: error instanceof Error ? error.message : "Unknown error",
      errorType: "update_error",
    };
  }
}

export async function deleteAvailabilitySlot(userId: string, slotId: string) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) throw new Error("User not found");

    // Delete the slot from WorkerAvailabilityTable
    const deletedSlot = await db
      .delete(WorkerAvailabilityTable)
      .where(eq(WorkerAvailabilityTable.id, slotId))
      .returning();

    if (deletedSlot.length === 0) {
      return { error: "Availability slot not found" };
    }

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting availability slot:", error);
    return { error: "Failed to delete availability slot" };
  }
}

export async function clearAllAvailability(userId: string) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) throw new Error("User not found");


    // Delete all availability slots for this user from WorkerAvailabilityTable
    await db
      .delete(WorkerAvailabilityTable)
      .where(eq(WorkerAvailabilityTable.userId, user.id));

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Error clearing availability:", error);
    return { error: "Failed to clear availability" };
  }
}
