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

    console.log('testAvailabilityAction: Found user:', user);

    if (!user) {
      console.log('testAvailabilityAction: User not found');
      return { error: "User not found", success: false };
    }

    console.log('testAvailabilityAction: User found, returning success');
    return { success: true, userId: user.id, userFound: true };
  } catch (error) {
    console.error("testAvailabilityAction error:", error);
    return { error: "Test failed", success: false };
  }
}
