"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { WorkerAvailabilityTable } from "@/lib/drizzle/schema/availability";
import { eq } from "drizzle-orm";
import { AvailabilitySlot, AvailabilityFormData } from "@/app/types/AvailabilityTypes";
import { revalidatePath } from "next/cache";

export async function getWorkerAvailability(userId: string) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      console.log('getWorkerAvailability: User not found for userId:', userId);
      return { error: "User not found", availability: [] };
    }

    // Use the WorkerAvailabilityTable instead of GigWorkerProfilesTable
    const availabilitySlots = await db.query.WorkerAvailabilityTable.findMany({
      where: eq(WorkerAvailabilityTable.userId, user.id),
    });

    console.log('getWorkerAvailability: availabilitySlots from WorkerAvailabilityTable:', availabilitySlots);

    // Convert the database records to AvailabilitySlot format
    const availability: AvailabilitySlot[] = availabilitySlots.map(slot => ({
      id: slot.id,
      startTime: slot.startTimeStr || '09:00',
      endTime: slot.endTimeStr || '17:00',
      days: slot.days as string[] || [],
      frequency: (slot.frequency || 'never') as "never" | "weekly" | "biweekly" | "monthly",
      ends: (slot.ends || 'never') as "never" | "on_date" | "after_occurrences",
      startDate: slot.startDate || undefined,
      endDate: slot.endDate || undefined,
      occurrences: slot.occurrences || undefined,
      notes: slot.notes || undefined,
      createdAt: slot.createdAt,
      updatedAt: slot.updatedAt,
    }));

    console.log('getWorkerAvailability: converted availability:', availability);
    
    return { availability };
  } catch (error) {
    console.error("Error fetching availability:", error);
    return { error: "Failed to fetch availability", availability: [] };
  }
}

export async function createAvailabilitySlot(userId: string, data: AvailabilityFormData) {
  try {
    console.log('createAvailabilitySlot called with userId:', userId);
    console.log('createAvailabilitySlot called with data:', data);
    console.log('createAvailabilitySlot data structure:', {
      startTime: data.startTime,
      endTime: data.endTime,
      days: data.days,
      frequency: data.frequency,
      ends: data.ends,
      startDate: data.startDate,
      endDate: data.endDate,
      occurrences: data.occurrences,
      notes: data.notes
    });
    
    // Validate required fields
    if (!data.startTime || !data.endTime || !data.days || !data.frequency || !data.ends) {
      console.error('createAvailabilitySlot: Missing required fields:', {
        startTime: !!data.startTime,
        endTime: !!data.endTime,
        days: !!data.days,
        frequency: !!data.frequency,
        ends: !!data.ends
      });
      return { error: "Missing required fields" };
    }
    
    // Validate data types
    if (!Array.isArray(data.days)) {
      console.error('createAvailabilitySlot: days is not an array:', data.days);
      return { error: "Days must be an array" };
    }
    
    if (data.days.length === 0) {
      console.error('createAvailabilitySlot: days array is empty');
      return { error: "At least one day must be selected" };
    }
    
    console.log('createAvailabilitySlot: All validations passed, proceeding with database operations');
    
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      console.log('createAvailabilitySlot: User not found for userId:', userId);
      return { error: "User not found" };
    }

    console.log('createAvailabilitySlot: Found user:', user.id);

    // Insert directly into WorkerAvailabilityTable
    console.log('createAvailabilitySlot: About to insert into WorkerAvailabilityTable with data:', {
      userId: user.id,
      days: data.days,
      frequency: data.frequency,
      startDate: data.startDate,
      startTimeStr: data.startTime,
      endTimeStr: data.endTime,
      ends: data.ends,
      occurrences: data.occurrences,
      endDate: data.endDate,
      notes: data.notes,
    });

    console.log('createAvailabilitySlot: Data types:', {
      startDate: typeof data.startDate,
      endDate: typeof data.endDate,
      startTime: typeof data.startTime,
      endTime: typeof data.endTime,
    });

    let newSlot;
    try {
      // Create proper timestamps for the required fields
      const createTimestamp = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      [newSlot] = await db.insert(WorkerAvailabilityTable).values({
        userId: user.id,
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
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
    } catch (dbError) {
      console.error('createAvailabilitySlot: Database insert error:', dbError);
      console.error('createAvailabilitySlot: Database error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined,
        error: dbError
      });
      return { 
        error: "Failed to create availability slot", 
        details: dbError instanceof Error ? dbError.message : 'Unknown database error',
        errorType: 'database_error'
      };
    }

    console.log('createAvailabilitySlot: Created new slot in WorkerAvailabilityTable:', newSlot);

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Error creating availability slot:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    return { 
      error: "Failed to create availability slot",
      details: error instanceof Error ? error.message : 'Unknown error',
      errorType: 'general_error'
    };
  }
}

export async function updateAvailabilitySlot(userId: string, slotId: string, data: AvailabilityFormData) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Update the slot in WorkerAvailabilityTable
    const [updatedSlot] = await db.update(WorkerAvailabilityTable)
      .set({
        days: data.days,
        frequency: data.frequency as "never" | "weekly" | "biweekly" | "monthly",
        startDate: data.startDate,
        startTimeStr: data.startTime,
        endTimeStr: data.endTime,
        ends: data.ends,
        occurrences: data.occurrences,
        endDate: data.endDate,
        notes: data.notes,
        updatedAt: new Date(),
      })
      .where(eq(WorkerAvailabilityTable.id, slotId))
      .returning();

    if (!updatedSlot) {
      return { error: "Availability slot not found" };
    }

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true, slot: updatedSlot };
  } catch (error) {
    console.error("Error updating availability slot:", error);
    return { error: "Failed to update availability slot" };
  }
}

export async function deleteAvailabilitySlot(userId: string, slotId: string) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    // Delete the slot from WorkerAvailabilityTable
    const deletedSlot = await db.delete(WorkerAvailabilityTable)
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

    if (!user) {
      return { error: "User not found" };
    }

    // Delete all availability slots for this user from WorkerAvailabilityTable
    await db.delete(WorkerAvailabilityTable)
      .where(eq(WorkerAvailabilityTable.userId, user.id));

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Error clearing availability:", error);
    return { error: "Failed to clear availability" };
  }
}
