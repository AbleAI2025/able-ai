"use server";
import { db } from "@/lib/drizzle/db";
import { BuyerProfilesTable, GigWorkerProfilesTable, NotificationPreferencesTable, TeamMembersTable, UsersTable } from "@/lib/drizzle/schema";
import { DiscountCodesTable } from "@/lib/drizzle/schema/payments";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import admin from "@/lib/firebase/firebase-server";

/**
 * Retrieves the complete profile of an authenticated user, including their notification preferences.
 * @param token Firebase ID token of the authenticated user.
 * @returns { success: true, data } or { success: false, error }
 */
export const getProfileInfoUserAction = async (token?: string) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { notificationPreferences: true },
    });

    return { success: true, data: pgUser };
  } catch (error) {
    console.error("Error retrieving user profile", error);
    return { success: false, error };
  }
};

/**
 * Updates the full name and phone number of the authenticated user
 * both in your DB and in Firebase Auth.
 * @param updateData Object containing `fullName` and `phone`.
 * @param token Firebase ID token of the authenticated user.
 * @returns { success: true, data } or { success: false, error }
 */
export const updateUserProfileAction = async (
  updateData: { fullName: string; phone?: string },
  token?: string
) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    const updatedUsers = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.firebaseUid, uid))
      .returning();

    await admin.auth().updateUser(uid, {
      displayName: updateData.fullName,
      phoneNumber: updateData.phone || undefined,
    });

    return { success: true, data: updatedUsers[0] || null };
  } catch (error) {
    console.error("Error updating user profile", error);
    return { success: false, error };
  }
};

/**
 * Updates the public/private visibility of the user's profile.
 * @param updateData Object containing `profileVisibility` boolean.
 * @param token Firebase ID token of the authenticated user.
 * @returns { success: true, data: boolean } or { success: false, error }
 */
export const updateProfileVisibilityAction = async (
  updateData: { profileVisibility: boolean },
  token?: string
) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    const updatedUsers = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.firebaseUid, uid))
      .returning();

    return { success: true, data: updatedUsers[0]?.profileVisibility };
  } catch (error) {
    console.error("Error updating profile visibility", error);
    return { success: false, error, data: !updateData.profileVisibility };
  }
};

/**
 * Updates the user's email notification preferences.
 * @param updateData Object containing `emailProferences` boolean.
 * @param token Firebase ID token of the authenticated user.
 * @returns { success: true, data: boolean } or { success: false, error }
 */
export const updateNotificationEmailAction = async (
  updateData: { emailProferences: boolean },
  token?: string
) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { notificationPreferences: true },
    });

    if (!pgUser) throw "Error retrieving user profile";

    const updatedUsers = await db
      .update(NotificationPreferencesTable)
      .set({ emailGigUpdates: updateData.emailProferences })
      .where(eq(NotificationPreferencesTable.userId, pgUser.id))
      .returning();

    const changed =
      updatedUsers[0]?.emailGigUpdates === updateData.emailProferences;

    if (changed) {
      return { success: true, data: updatedUsers[0]?.emailGigUpdates };
    } else {
      throw "Error updating notification email preferences";
    }
  } catch (error) {
    console.error("Error updating email preferences", error);
    return { success: false, error, data: !updateData.emailProferences };
  }
};

/**
 * Updates the user's SMS notification preferences.
 * @param updateData Object containing `smsGigAlerts` boolean.
 * @param token Firebase ID token of the authenticated user.
 * @returns { success: true, data: boolean } or { success: false, error }
 */
export const updateNotificationSmsAction = async (
  updateData: { smsGigAlerts: boolean },
  token?: string
) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { notificationPreferences: true },
    });

    if (!pgUser) throw "Error retrieving user profile";

    const updatedUsers = await db
      .update(NotificationPreferencesTable)
      .set({ smsGigAlerts: updateData.smsGigAlerts })
      .where(eq(NotificationPreferencesTable.userId, pgUser.id))
      .returning();

    return { success: true, data: updatedUsers[0]?.smsGigAlerts };
  } catch (error) {
    console.error("Error updating SMS preferences", error);
    return { success: false, error, data: updateData.smsGigAlerts };
  }
};

function generateReferralCode() {
  return "REF-" + crypto.randomBytes(3).toString("hex").toUpperCase();
}

export const getUserReferralCodeAction = async ({
  firebaseUid,
}: {
  firebaseUid: string;
}) => {
  try {
    const userWithCode = await db
      .select({
        code: DiscountCodesTable.code,
        userId: UsersTable.id,
      })
      .from(UsersTable)
      .leftJoin(
        DiscountCodesTable,
        eq(DiscountCodesTable.userId, UsersTable.id)
      )
      .where(eq(UsersTable.firebaseUid, firebaseUid));

    if (!userWithCode.length) {
      throw new Error("User not found for firebaseUid " + firebaseUid);
    }

    if (userWithCode[0].code) {
      return { code: userWithCode[0].code };
    }

    const newCode = generateReferralCode();

    const [inserted] = await db
      .insert(DiscountCodesTable)
      .values({
        code: newCode,
        type: "USER_REFERRAL",
        userId: userWithCode[0].userId,
        discountAmount: "5.00",
        alreadyUsed: false,
      })
      .returning({ code: DiscountCodesTable.code });

    return inserted;
  } catch (error) {
    console.error("Error in getUserReferralCodeAction:", error);
    return null;
  }
};

export const deleteUserAccountAction = async (token?: string) => {
  try {
    if (!token) throw "Token is required";

    const { data, uid } = await isUserAuthenticated(token);
    if (!data) throw ERROR_CODES.UNAUTHORIZED;

    await admin.auth().deleteUser(uid);

    const pgUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!pgUser) throw new Error("User not found in database");

    const userId = pgUser.id;

    await db
      .update(UsersTable)
      .set({
        email: `${uid}@able.com`,
        fullName: "*********",
        phone: "*********",
        isDisabled: true,
        isBanned: true,
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, userId));

    await db
      .update(GigWorkerProfilesTable)
      .set({
        fullBio: "*********",
        location: "*********",
        address: "*********",
        latitude: null,
        longitude: null,
        privateNotes: "*********",
        videoUrl: "*********",
        socialLink: "*********",
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, userId));

    await db
      .update(BuyerProfilesTable)
      .set({
        fullCompanyName: "*********",
        vatNumber: "*********",
        businessRegistrationNumber: "*********",
        billingAddressJson: { deleted: true },
        videoUrl: "*********",
        companyRole: "*********",
        updatedAt: new Date(),
      })
      .where(eq(BuyerProfilesTable.userId, userId));

    await db
      .update(TeamMembersTable)
      .set({
        name: "*********",
        email: "*********",
        roleInTeam: "*********",
        updatedAt: new Date(),
      })
      .where(eq(TeamMembersTable.memberUserId, userId));

    return { success: true };
  } catch (error) {
    console.error("Error deleting user account:", error);
    return { success: false, error: "Error deleting user account" };
  }
};
