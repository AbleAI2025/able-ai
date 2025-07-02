"use server";
import { db } from "@/lib/drizzle/db"; // Correct path to your Drizzle instance
import { NotificationPreferencesTable, UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

export const getProfileInfoUserAction = async (firebaseUid?: string) => {
  try {
    if (!firebaseUid) throw "Error getting user profile";
    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      with: {
        notificationPreferences: true,
      },
    });

    return pgUser;
  } catch (error) {
    console.log("Error getting user profile");
  }
};

export const updateUserProfileAction = async (
  updateData: {fullName: string, phone: string},
  firebaseUid?: string
) => {
  try {
    if (!firebaseUid) throw "Error getting user profile";
    const updatedUsers = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.firebaseUid, firebaseUid))
      .returning();

    return updatedUsers[0] || null;
  } catch (error) {
    console.log("Error updating user profile");
  }
};

export const updateProfileVisibilityAction = async (
  updateData: {profileVisibility: boolean},
  firebaseUid?: string
) => {
  try {
    if (!firebaseUid) throw "Error getting user profile";
    const updatedUsers = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.firebaseUid, firebaseUid))
      .returning();
      
    return updatedUsers[0].profileVisibility;
  } catch (error) {
    console.log("Error updating user profile",  error);
  }
};

export const updateNotificationEmailAction = async (
  updateData: {emailProferences: boolean},
  firebaseUid?: string
) => {
  try {
    if (!firebaseUid) throw "Error getting user profile";

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      with: {
        notificationPreferences: true,
      },
    });

    if (!pgUser) throw "Error getting user profile";

    const updatedUsers = await db
      .update(NotificationPreferencesTable)
      .set({emailGigUpdates: updateData.emailProferences} )
      .where(eq(NotificationPreferencesTable.userId, pgUser.id))
      .returning();
      
    return updatedUsers[0].emailGigUpdates;
  } catch (error) {
    console.log("Error updating user profile",  error);
  }
};

export const updateNotificationSmsAction = async (
  updateData: {smsGigAlerts: boolean},
  firebaseUid?: string
) => {
  try {
    if (!firebaseUid) throw "Error getting user profile";

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      with: {
        notificationPreferences: true,
      },
    });

    if (!pgUser) throw "Error getting user profile";

    const updatedUsers = await db
      .update(NotificationPreferencesTable)
      .set({smsGigAlerts: updateData.smsGigAlerts} )
      .where(eq(NotificationPreferencesTable.userId, pgUser?.id))
      .returning();
      
    return updatedUsers[0].smsGigAlerts;
  } catch (error) {
    console.log("Error updating user profile",  error);
  }
};
