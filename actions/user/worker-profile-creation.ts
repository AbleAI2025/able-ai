"use server";

import { db } from "@/lib/drizzle/db";
import { GigWorkerProfilesTable, UsersTable } from "@/lib/drizzle/schema";

import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";
import { OnboardingProfileData } from "@/app/types/workerProfileTypes";
import { eq } from "drizzle-orm";
import {
  parseLocationData,
  saveAvailabilityData,
  extractExperienceYears,
  saveSkillsData,
  saveQualificationsData,
  saveEquipmentData,
} from "./worker-profile-creation-helpers";

export const createWorkerProfileAction = async (token: string) => {
  try {
    if (!token) {
      throw new Error("Token is required");
    }

    const { uid } = await isUserAuthenticated(token);

    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    // Check if worker profile already exists

    const existingWorkerProfile =
      await db.query.GigWorkerProfilesTable.findFirst({
        where: eq(GigWorkerProfilesTable.userId, user.id),
      });

    if (existingWorkerProfile) {
      return {
        success: true,
        data: "Worker profile already exists",
        workerProfileId: existingWorkerProfile.id,
      };
    }

    // Create new worker profile

    const newProfile = await db
      .insert(GigWorkerProfilesTable)
      .values({
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    const workerProfileId = newProfile[0].id;

    // Update user table to mark as gig worker

    await db
      .update(UsersTable)
      .set({
        isGigWorker: true,
        lastRoleUsed: "GIG_WORKER",
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, user.id));

    return {
      success: true,
      data: "Worker profile created successfully",
      workerProfileId,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const saveWorkerProfileFromOnboardingAction = async (
  profileData: OnboardingProfileData,
  token: string
) => {
  try {
    // Validate required fields
    if (!profileData.about || profileData.about.trim().length === 0) {
      throw new Error("About field is required");
    }
    if (!profileData.skills || profileData.skills.trim().length === 0) {
      throw new Error("Skills field is required");
    }
    if (!profileData.hourlyRate || profileData.hourlyRate.trim().length === 0) {
      throw new Error("Hourly rate field is required");
    }

    if (!token) {
      throw new Error("Token is required");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: { gigWorkerProfile: true },
    });

    if (!user) throw "User not found";

    // Validate hourly rate minimum
    const validatedHourlyRate = parseFloat(profileData.hourlyRate || "0");
    if (validatedHourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      throw new Error(
        `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`
      );
    }

    // Use provided hashtags (always provided by client)
    const generatedHashtags = profileData.hashtags || [];

    // Parse location data
    const { latitude, longitude, locationText } = await parseLocationData(
      profileData
    );

    const profileUpdateData = {
      fullBio: profileData.about,
      location: locationText,
      latitude: latitude ? String(latitude) : null,
      longitude: longitude ? String(longitude) : null,
      // Remove availabilityJson - we'll save to worker_availability table instead
      hashtags:
        generatedHashtags.length > 0
          ? generatedHashtags
          : [
              `#${
                profileData.skills
                  ?.split(",")[0]
                  ?.trim()
                  .toLowerCase()
                  .replace(/\s+/g, "-") || "worker"
              }`,
              `#${
                profileData.about?.split(" ")[0]?.toLowerCase() ||
                "professional"
              }`,
              "#gig-worker",
            ],
      semanticProfileJson: {
        tags: profileData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        qualifications: profileData.qualifications
          ? profileData.qualifications
              .split(",")
              .map((qual) => qual.trim())
              .filter(Boolean)
          : [],
      },
      privateNotes: `Hourly Rate: ${profileData.hourlyRate}\n`,
      updatedAt: new Date(),
    };

    let workerProfileId: string;

    try {
      if (user.gigWorkerProfile) {
        // Update existing profile
        await db
          .update(GigWorkerProfilesTable)
          .set(profileUpdateData)
          .where(eq(GigWorkerProfilesTable.userId, user.id));
        workerProfileId = user.gigWorkerProfile.id;
      } else {
        // Create new profile
        const newProfile = await db
          .insert(GigWorkerProfilesTable)
          .values({
            userId: user.id,
            ...profileUpdateData,
            createdAt: new Date(),
          })
          .returning();
        workerProfileId = newProfile[0].id;
      }
    } catch (dbError) {
      throw new Error(
        `Database error: ${
          dbError instanceof Error ? dbError.message : "Unknown database error"
        }`
      );
    }

    // Save availability data
    await saveAvailabilityData(
      user.id,
      profileData.availability,
      profileData.hourlyRate
    );

    // Save skills data
    try {
      const skillName = profileData.skills || profileData.jobTitle || "";
      const yearsOfExperience = await extractExperienceYears(
        profileData.experience || ""
      );
      const extractedHourlyRate = profileData.hourlyRate
        ? parseFloat(profileData.hourlyRate)
        : validatedHourlyRate;

      if (skillName) {
        await saveSkillsData(
          workerProfileId,
          skillName,
          yearsOfExperience,
          String(extractedHourlyRate || validatedHourlyRate),
          profileData.hashtags,
          profileData.videoIntro
        );
      }

      // Save qualifications data
      await saveQualificationsData(workerProfileId, profileData.qualifications);
    } catch (skillError) {
      console.error("Error saving skills data:", skillError);
      // Don't fail the entire profile save if skills saving fails
    }

    // Save equipment data
    await saveEquipmentData(workerProfileId, profileData.equipment);

    // Skills field is ignored - only jobTitle is saved as THE skill
    // Job title is already saved as THE skill above - no duplicate saving needed

    // Update user table to mark as gig worker
    await db
      .update(UsersTable)
      .set({
        isGigWorker: true,
        lastRoleUsed: "GIG_WORKER",
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, user.id));

    return {
      success: true,
      data: "Worker profile saved successfully",
      workerProfileId,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
