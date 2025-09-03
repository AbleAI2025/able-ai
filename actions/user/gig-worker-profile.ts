"use server";

import PublicWorkerProfile from "@/app/types/workerProfileTypes";
import { db } from "@/lib/drizzle/db";
import { GigWorkerProfilesTable, SkillsTable } from "@/lib/drizzle/schema";
import { eq, sql } from "drizzle-orm";

// Internal imports
import {
  validateUserAuthentication,
  validateHourlyRate,
  handleActionError,
} from "../utils/get-gig-worker-profile";
import { GigWorkerProfileService } from "../services/get-gig-worker-profile";
import { ProfileDataHandler } from "../handlers/get-profile-data";
import { SkillDataHandler } from "../handlers/get-skill-data";
import type {
  ActionResult,
  CreateSkillData,
  OnboardingProfileData,
  SkillProfile,
} from "../types/get-gig-worker-profile";

// ========================================
// PUBLIC PROFILE ACTIONS
// ========================================

export const getPublicWorkerProfileAction = async (
  workerId: string
): Promise<ActionResult<PublicWorkerProfile>> => {
  try {
    if (!workerId) {
      throw new Error("Worker ID is required");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerId),
    });

    return await ProfileDataHandler.buildWorkerProfile(workerProfile);
  } catch (error) {
    return handleActionError(error);
  }
};

export const getPrivateWorkerProfileAction = async (
  token: string
): Promise<ActionResult<PublicWorkerProfile>> => {
  try {
    const { user } = await validateUserAuthentication(token);

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    return await ProfileDataHandler.buildWorkerProfile(workerProfile);
  } catch (error) {
    return handleActionError(error);
  }
};

// Legacy function - kept for compatibility
export const getGigWorkerProfile = async (
  workerProfile: typeof GigWorkerProfilesTable.$inferSelect | undefined
): Promise<ActionResult<PublicWorkerProfile>> => {
  return await ProfileDataHandler.buildWorkerProfile(workerProfile);
};

// ========================================
// PROFILE MANAGEMENT ACTIONS
// ========================================

export const createWorkerProfileAction = async (
  token: string
): Promise<ActionResult<string>> => {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1 as test`);

    const { user } = await validateUserAuthentication(token);

    const workerProfileId = await GigWorkerProfileService.upsertWorkerProfile(
      user.id
    );
    await GigWorkerProfileService.markUserAsGigWorker(user.id);

    return {
      success: true,
      data: "Worker profile created successfully",
      workerProfileId,
    };
  } catch (error) {
    return handleActionError(error);
  }
};

export const saveWorkerProfileFromOnboardingAction = async (
  profileData: OnboardingProfileData,
  token: string
): Promise<ActionResult<string>> => {
  try {
    const { user } = await validateUserAuthentication(token);
    validateHourlyRate(profileData.hourlyRate);

    const profileUpdateData =
      ProfileDataHandler.prepareProfileUpdateData(profileData);
    const workerProfileId = await GigWorkerProfileService.upsertWorkerProfile(
      user.id,
      profileUpdateData
    );

    // Save related data in parallel
    await Promise.all([
      // Save availability
      profileData.availability && typeof profileData.availability === "object"
        ? GigWorkerProfileService.saveAvailabilityData(
            profileData.availability,
            user.id,
            profileData.hourlyRate
          )
        : Promise.resolve(),

      // Save job title as skill
      profileData.jobTitle
        ? GigWorkerProfileService.saveJobTitleAsSkill(
            profileData.jobTitle,
            workerProfileId,
            profileData.hourlyRate
          )
        : Promise.resolve(),

      // Save equipment
      profileData.equipment?.length
        ? GigWorkerProfileService.saveEquipmentData(
            profileData.equipment,
            workerProfileId
          )
        : Promise.resolve(),

      // Update user as gig worker
      GigWorkerProfileService.markUserAsGigWorker(user.id),
    ]);

    return {
      success: true,
      data: "Worker profile saved successfully",
      workerProfileId,
    };
  } catch (error) {
    return handleActionError(error);
  }
};

// ========================================
// SKILL MANAGEMENT ACTIONS
// ========================================

export const getSkillDetailsWorker = async (
  id: string
): Promise<ActionResult<SkillProfile>> => {
  try {
    if (!id) {
      throw new Error("Skill ID is required");
    }

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, id),
    });

    if (!skill) {
      throw new Error("Skill not found");
    }

    return await SkillDataHandler.buildSkillProfile(skill);
  } catch (error) {
    return handleActionError(error);
  }
};

export const createSkillWorker = async (
  token: string,
  skillData: CreateSkillData
): Promise<ActionResult> => {
  try {
    const { user } = await validateUserAuthentication(token);
    const validatedRate = validateHourlyRate(skillData.agreedRate);

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    const [newSkill] = await db
      .insert(SkillsTable)
      .values({
        workerProfileId: workerProfile.id,
        name: skillData.name,
        experienceMonths: 0,
        experienceYears: skillData.experienceYears,
        agreedRate: String(validatedRate),
        skillVideoUrl: skillData.skillVideoUrl || null,
        adminTags: skillData.adminTags?.length ? skillData.adminTags : null,
        ableGigs: null,
        images: skillData.images || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newSkill };
  } catch (error) {
    return handleActionError(error);
  }
};

// ========================================
// MEDIA MANAGEMENT ACTIONS
// ========================================

export const updateVideoUrlProfileAction = async (
  videoUrl: string,
  token?: string
): Promise<ActionResult<string>> => {
  try {
    const { user } = await validateUserAuthentication(token || "");

    await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user.id));

    return { success: true, data: "Video URL updated successfully" };
  } catch (error) {
    return handleActionError(error);
  }
};

export const updateProfileImageAction = async (
  token: string,
  skillId: string,
  newImage: string
): Promise<ActionResult<string[]>> => {
  try {
    await validateUserAuthentication(token);

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, skillId),
      columns: { images: true },
    });

    if (!skill) {
      throw new Error("Skill not found");
    }

    const updatedImages = [...(skill.images ?? []), newImage];

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, skillId));

    return { success: true, data: updatedImages };
  } catch (error) {
    return handleActionError(error);
  }
};

export const deleteImageAction = async (
  token: string,
  skillId: string,
  imageUrl: string
): Promise<ActionResult<string[]>> => {
  try {
    await validateUserAuthentication(token);

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, skillId),
      columns: { images: true },
    });

    if (!skill) {
      throw new Error("Skill not found");
    }

    const updatedImages = skill.images?.filter((img) => img !== imageUrl) || [];

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, skillId));

    return { success: true, data: updatedImages };
  } catch (error) {
    return handleActionError(error);
  }
};

// ========================================
// EXPORTS - Everything centralized here
// ========================================

// Re-export types for external use
export type {
  CreateSkillData,
  AvailabilityData,
  EquipmentData,
  OnboardingProfileData,
  ActionResult,
  SkillProfile,
} from "../types/get-gig-worker-profile";

// Re-export services for advanced usage
export { GigWorkerProfileService } from "../services/get-gig-worker-profile";
export { ProfileDataHandler } from "../handlers/get-profile-data";
export { SkillDataHandler } from "../handlers/get-skill-data";

// Re-export utilities
export {
  validateUserAuthentication,
  validateHourlyRate,
  calculateAverageRating,
  createTimestamp,
} from "../utils/get-gig-worker-profile";
