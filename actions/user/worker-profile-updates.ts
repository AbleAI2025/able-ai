"use server";

import { db } from "@/lib/drizzle/db";
import { GigWorkerProfilesTable, SkillsTable, UsersTable } from "@/lib/drizzle/schema";

import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const updateVideoUrlWorkerProfileAction = async (
  videoUrl: string,
  token: string
) => {
  try {
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw new Error("User not found");

    const result = await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id))
      .returning({ videoUrl: GigWorkerProfilesTable.videoUrl });

    // Verify the update was successful
    if (result.length === 0 || result[0].videoUrl !== videoUrl) {
      throw new Error("Failed to verify video URL update");
    }

    return { success: true, data: "Video URL updated successfully" };
  } catch (error) {
    console.error("Video URL update error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateSocialLinkWorkerProfileAction = async (
  socialLink: string,
  token: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });
    if (!user) throw new Error("User not found");

    await db
      .update(GigWorkerProfilesTable)
      .set({
        socialLink,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateWorkerHashtagsAction = async (
  token: string,
  hashtags: string[]
) => {
  try {
    if (!token) throw new Error("User ID is required");

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { gigWorkerProfile: true },
    });
    if (!user || !user?.gigWorkerProfile) throw "User worker profile not found";

    await db
      .update(GigWorkerProfilesTable)
      .set({
        hashtags,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.id, user.gigWorkerProfile.id));

    return { success: true, data: hashtags };
  } catch (error) {
    console.error("Failed to update worker hashtags:", error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while updating hashtags.";
    return { success: false, data: null, error: message };
  }
};

export const updateVideoUrlWorkerSkillAction = async (
  videoUrl: string,
  token: string,
  skillId: string
) => {
  try {
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: {
        gigWorkerProfile: true
      }
    });

    if (!user) throw new Error("User not found");

    const result = await db
      .update(SkillsTable)
      .set({
        skillVideoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, skillId))
      .returning({ videoUrl: SkillsTable.skillVideoUrl });

    // Verify the update was successful
    if (result.length === 0 || result[0].videoUrl !== videoUrl) {
      throw new Error("Failed to verify video URL update");
    }

    return { success: true, data: "Video URL updated successfully" };
  } catch (error) {
    console.error("Video URL update error:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};