"use server";

import { db } from "@/lib/drizzle/db";
import { GigWorkerProfilesTable, UsersTable } from "@/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";
import { AvailabilitySlot, AvailabilityFormData } from "@/app/types/AvailabilityTypes";
import { revalidatePath } from "next/cache";

export async function getWorkerAvailability(userId: string) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found", availability: [] };
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile || !workerProfile.availabilityJson) {
      return { availability: [] };
    }

    const availability = workerProfile.availabilityJson as AvailabilitySlot[];
    return { availability };
  } catch (error) {
    console.error("Error fetching availability:", error);
    return { error: "Failed to fetch availability", availability: [] };
  }
}

export async function createAvailabilitySlot(userId: string, data: AvailabilityFormData) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    let workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      // Create worker profile if it doesn't exist
      const [newProfile] = await db.insert(GigWorkerProfilesTable).values({
        userId: user.id,
        availabilityJson: [],
      }).returning();
      workerProfile = newProfile;
    }

    const newSlot: AvailabilitySlot = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentAvailability = (workerProfile.availabilityJson as AvailabilitySlot[]) || [];
    const updatedAvailability = [...currentAvailability, newSlot];

    await db.update(GigWorkerProfilesTable)
      .set({
        availabilityJson: updatedAvailability,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true, slot: newSlot };
  } catch (error) {
    console.error("Error creating availability slot:", error);
    return { error: "Failed to create availability slot" };
  }
}

export async function updateAvailabilitySlot(userId: string, slotId: string, data: Partial<AvailabilityFormData>) {
  try {
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      return { error: "User not found" };
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile || !workerProfile.availabilityJson) {
      return { error: "No availability found" };
    }

    const currentAvailability = workerProfile.availabilityJson as AvailabilitySlot[];
    const slotIndex = currentAvailability.findIndex(slot => slot.id === slotId);

    if (slotIndex === -1) {
      return { error: "Availability slot not found" };
    }

    const updatedSlot = {
      ...currentAvailability[slotIndex],
      ...data,
      updatedAt: new Date(),
    };

    currentAvailability[slotIndex] = updatedSlot;

    await db.update(GigWorkerProfilesTable)
      .set({
        availabilityJson: currentAvailability,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

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

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile || !workerProfile.availabilityJson) {
      return { error: "No availability found" };
    }

    const currentAvailability = workerProfile.availabilityJson as AvailabilitySlot[];
    const filteredAvailability = currentAvailability.filter(slot => slot.id !== slotId);

    await db.update(GigWorkerProfilesTable)
      .set({
        availabilityJson: filteredAvailability,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

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

    await db.update(GigWorkerProfilesTable)
      .set({
        availabilityJson: [],
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

    revalidatePath(`/user/${userId}/worker/calendar`);
    return { success: true };
  } catch (error) {
    console.error("Error clearing availability:", error);
    return { error: "Failed to clear availability" };
  }
}
