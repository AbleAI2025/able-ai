"use server";

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";

export async function testAvailabilityAction(userId: string) {
  try {
    console.log('testAvailabilityAction called with userId:', userId);
    
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      console.log('testAvailabilityAction: User not found');
      return { error: "User not found" };
    }

    console.log('testAvailabilityAction: User found:', user.id);
    
    // Test database connection by checking if we can query the user
    const testUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, user.id),
    });

    if (!testUser) {
      console.log('testAvailabilityAction: Database query failed');
      return { error: "Database query failed" };
    }

    console.log('testAvailabilityAction: Database connection successful');
    return { success: true, message: "Database connection and user lookup successful" };
  } catch (error) {
    console.error("testAvailabilityAction error:", error);
    return { error: "Test failed", details: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function testUpdateAvailabilityAction(userId: string, slotId: string) {
  try {
    console.log('testUpdateAvailabilityAction called with userId:', userId, 'slotId:', slotId);
    
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, userId),
    });

    if (!user) {
      console.log('testUpdateAvailabilityAction: User not found');
      return { error: "User not found" };
    }

    console.log('testUpdateAvailabilityAction: User found:', user.id);
    
    // Import the update function to test it
    const { updateAvailabilitySlot } = await import('./manage-availability.js');
    
    // Test data for update
    const testData = {
      startTime: "10:00",
      endTime: "18:00",
      days: ["Mon", "Tue", "Wed"],
      frequency: "weekly" as const,
      ends: "never" as const,
      notes: "Test update"
    };
    
    console.log('testUpdateAvailabilityAction: Testing update with data:', testData);
    
    const result = await updateAvailabilitySlot(userId, slotId, testData);
    
    console.log('testUpdateAvailabilityAction: Update result:', result);
    
    return result;
  } catch (error) {
    console.error("testUpdateAvailabilityAction error:", error);
    return { error: "Update test failed", details: error instanceof Error ? error.message : 'Unknown error' };
  }
}
