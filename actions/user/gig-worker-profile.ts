"use server";

import PublicWorkerProfile, {
  Availability,
  SemanticProfile,
} from "@/app/types/workerProfileTypes";
import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  EquipmentTable,
  GigWorkerProfilesTable,
  QualificationsTable,
  ReviewsTable,
  SkillsTable,
  UserBadgesLinkTable,
  UsersTable,
  WorkerAvailabilityTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { and, eq, sql } from "drizzle-orm";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";

export const getPublicWorkerProfileAction = async (workerId: string) => {
  if (!workerId) throw "Worker ID is required";

  const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(GigWorkerProfilesTable.id, workerId),
  });

  const data = await getGigWorkerProfile(workerProfile);

  return data;
};

export const getPrivateWorkerProfileAction = async (token: string) => {
  if (!token) {
    throw new Error("User ID is required to fetch buyer profile");
  }

  const { uid } = await isUserAuthenticated(token);
  if (!uid) throw ERROR_CODES.UNAUTHORIZED;

  const user = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.firebaseUid, uid),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(GigWorkerProfilesTable.userId, user.id),
    with: { user: {columns: { rtwStatus: true }} },
  });

  const data = await getGigWorkerProfile(workerProfile);

  return data;
};
export const getGigWorkerProfile = async (
  workerProfile: typeof GigWorkerProfilesTable.$inferSelect | undefined,
): Promise<{ success: true; data: PublicWorkerProfile }> => {
  try {
    if (!workerProfile) throw "Getting worker profile error";

    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerProfile.id),
    });

    const equipment = await db.query.EquipmentTable.findMany({
      where: eq(EquipmentTable.workerProfileId, workerProfile.id),
    });

    const qualifications = await db.query.QualificationsTable.findMany({
      where: eq(QualificationsTable.workerProfileId, workerProfile.id),
    });

    const awards = await db.query.UserBadgesLinkTable.findMany({
      where: eq(UserBadgesLinkTable.userId, workerProfile.userId),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM"),
      ),
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
      ),
    });

    const totalReviews = reviews?.length;

    const positiveReviews = reviews?.filter((item) => item.rating === 1).length;

    const averageRating =
      totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

    const data = {
      ...workerProfile,
      fullBio: workerProfile?.fullBio ?? undefined,
      location: workerProfile?.location ?? undefined,
      privateNotes: workerProfile?.privateNotes ?? undefined,
      responseRateInternal: workerProfile?.responseRateInternal ?? undefined,
      videoUrl: workerProfile?.videoUrl ?? undefined,
      availabilityJson: undefined, // Set to undefined since we now use worker_availability table
      semanticProfileJson:
        workerProfile?.semanticProfileJson as SemanticProfile,
      averageRating,
      awards,
      equipment,
      skills,
      reviews,
      recommendations,
      qualifications,
    };

    return { success: true, data };
  } catch (error) {
    
    throw error;
  }
};

export const getSkillDetailsWorker = async (id: string) => {
  try {
    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, id),
    });

    if (!skill) throw "Skill not found";

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, skill?.workerProfileId),
    });

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, workerProfile?.userId || ""),
    });

    const badges = await db
      .select({
        id: UserBadgesLinkTable.id,
        awardedAt: UserBadgesLinkTable.awardedAt,
        awardedBySystem: UserBadgesLinkTable.awardedBySystem,
        notes: UserBadgesLinkTable.notes,
        badge: {
          id: BadgeDefinitionsTable.id,
          name: BadgeDefinitionsTable.name,
          description: BadgeDefinitionsTable.description,
          icon: BadgeDefinitionsTable.iconUrlOrLucideName,
          type: BadgeDefinitionsTable.type,
        },
      })
      .from(UserBadgesLinkTable)
      .innerJoin(
        BadgeDefinitionsTable,
        eq(UserBadgesLinkTable.badgeId, BadgeDefinitionsTable.id),
      )
      .where(eq(UserBadgesLinkTable.userId, workerProfile?.userId || ""));

    const qualifications = await db.query.QualificationsTable.findMany({
      where: eq(QualificationsTable.workerProfileId, workerProfile?.id || ""),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM"),
      ),
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
        eq(ReviewsTable.skillId, skill.id),
      ),
    });

    const reviewsData = await Promise.all(
      reviews.map(async (review) => {
        if (!review.authorUserId) {
          return {
            name: "Unknown",
            date: review.createdAt,
            text: review.comment,
          };
        }

        const author = await db.query.UsersTable.findFirst({
          where: eq(UsersTable.id, review.authorUserId),
        });

        return {
          name: author?.fullName || "Unknown",
          date: review.createdAt,
          text: review.comment,
        };
      }),
    );

    const recommendationsData = await Promise.all(
      recommendations.map(async (recommendation) => {
        return {
          name: recommendation.recommenderName,
          date: recommendation.createdAt,
          text: recommendation.comment,
        };
      }),
    );

    const skillProfile = {
      profileId: workerProfile?.id,
      name: user?.fullName,
      title: skill?.name,
      hashtags: Array.isArray(workerProfile?.hashtags)
        ? workerProfile.hashtags.join(" ")
        : "",
      customerReviewsText: workerProfile?.fullBio,
      ableGigs: skill?.ableGigs,
      experienceYears: skill?.experienceYears,
      Eph: skill?.agreedRate,
      location: workerProfile?.location || "",
      address: workerProfile?.address || "",
      latitude: workerProfile?.latitude ?? 0,
      longitude: workerProfile?.longitude ?? 0,
      videoUrl: workerProfile?.videoUrl || "",
      statistics: {
        reviews: reviews?.length,
        paymentsCollected: "£4899",
        tipsReceived: "£767",
      },
      supportingImages: skill.images ?? [],
      badges,
      qualifications,
      buyerReviews: reviewsData,
      recommendations: recommendationsData,
    };

    return { success: true, data: skillProfile };
  } catch (error) {

    return { success: false, data: null, error };
  }
};

export const createSkillWorker = async (
  token: string,
  {
    name,
    experienceYears,
    agreedRate,
    skillVideoUrl,
    adminTags = [],
    images = [],
  }: {
    name: string;
    experienceYears: number;
    agreedRate: number | string;
    skillVideoUrl?: string;
    adminTags?: string[];
    images?: string[];
  },
) => {
  try {
    if (!token) throw new Error("Token is required");
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw new Error("Unauthorized");

    // Validate hourly rate minimum
    const hourlyRate = parseFloat(String(agreedRate));
    if (hourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      throw new Error(`Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`);
    }

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      throw new Error("User not found");
    }

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
        name,
        experienceMonths: 0,
        experienceYears,
        agreedRate: String(agreedRate),
        skillVideoUrl: skillVideoUrl || null,
        adminTags: adminTags.length > 0 ? adminTags : null,
        ableGigs: null,
        images,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: newSkill };
  } catch (error) {

    return { success: false, data: null, error };
  }
};

export const updateVideoUrlProfileAction = async (
  videoUrl: string,
  token?: string | undefined,
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user?.id));

    return { success: true, data: "Url video updated successfully" };
  } catch (error) {

    return { success: false, data: "Url video updated successfully", error };
  }
};

export const updateProfileImageAction = async (
  token: string,
  id: string,
  newImage: string,
) => {
  try {
    if (!token) throw new Error("User ID is required");

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, id),
      columns: { images: true },
    });

    const updatedImages = [...(skill?.images ?? []), newImage];

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, id));

    return { success: true, data: updatedImages };
  } catch (error) {

    return { success: false, data: null, error };
  }
};

export const deleteImageAction = async (
  token: string,
  skillId: string,
  imageUrl: string,
) => {
  try {
    if (!token) throw new Error("User ID is required");

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, skillId),
      columns: { images: true },
    });

    if (!skill) throw "Skill not found";

    const updatedImages = skill?.images?.filter((img) => img !== imageUrl);

    await db
      .update(SkillsTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(SkillsTable.id, skillId));

    return { success: true, data: updatedImages };
  } catch (error) {

    return { success: false, data: null, error };
  }
};

export const createWorkerProfileAction = async (token: string) => {
  try {

    
    // Test database connection

    try {
      const testQuery = await db.execute(sql`SELECT 1 as test`);

    } catch (dbError) {

      throw new Error(`Database connection failed: ${dbError}`);
    }
    
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

    const existingWorkerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });


    if (existingWorkerProfile) {

      return { success: true, data: "Worker profile already exists", workerProfileId: existingWorkerProfile.id };
    }

    // Create new worker profile

    const newProfile = await db.insert(GigWorkerProfilesTable).values({
      userId: user.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    

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


    return { success: true, data: "Worker profile created successfully", workerProfileId };
  } catch (error) {

    return { success: false, data: null, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const saveWorkerProfileFromOnboardingAction = async (
  profileData: {
    about: string;
    experience: string;
    skills: string;
    hourlyRate: string;
    location: any;
    availability:
      | {
          days: string[];
          startTime: string;
          endTime: string;
          frequency?: string;
          ends?: string;
          startDate?: string; // Add this field
          endDate?: string;
          occurrences?: number;
        }
      | string;
    videoIntro: File | string;
    jobTitle?: string; // Add job title field
    equipment?: { name: string; description?: string }[]; // Add equipment field
  },
  token: string,
) => {
  try {

    
    if (!token) {
      throw new Error("Token is required");
    }

    // Validate hourly rate minimum
    const hourlyRate = parseFloat(profileData.hourlyRate || '0');
    if (hourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      throw new Error(`Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`);
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    // Check if worker profile already exists
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    // Prepare profile data
    const profileUpdateData = {
      fullBio: `${profileData.about}\n\n${profileData.experience}`,
      location:
        typeof profileData.location === "string"
          ? profileData.location
          : profileData.location?.formatted_address ||
            profileData.location?.name ||
            "",
      latitude:
        typeof profileData.location === "object" && profileData.location?.lat
          ? profileData.location.lat
          : null,
      longitude:
        typeof profileData.location === "object" && profileData.location?.lng
          ? profileData.location.lng
          : null,
      // Remove availabilityJson - we'll save to worker_availability table instead
      videoUrl:
        typeof profileData.videoIntro === "string"
          ? profileData.videoIntro
          : profileData.videoIntro?.name || "",
      semanticProfileJson: {
        tags: profileData.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      },
      privateNotes: `Hourly Rate: ${profileData.hourlyRate}\n`,
      updatedAt: new Date(),
    };

    let workerProfileId: string;
    
    if (workerProfile) {
      // Update existing profile
      await db
        .update(GigWorkerProfilesTable)
        .set(profileUpdateData)
        .where(eq(GigWorkerProfilesTable.userId, user.id));
      workerProfileId = workerProfile.id;
    } else {
      // Create new profile
      const newProfile = await db.insert(GigWorkerProfilesTable).values({
        userId: user.id,
        ...profileUpdateData,
        createdAt: new Date(),
      }).returning();
      workerProfileId = newProfile[0].id;
    }

    // Save availability data to worker_availability table
    if (
      profileData.availability &&
      typeof profileData.availability === "object"
    ) {
      // Create proper timestamps for the required fields
      const createTimestamp = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      await db.insert(WorkerAvailabilityTable).values({
        userId: user.id,
        days: profileData.availability.days || [],
        frequency: (profileData.availability.frequency || "never") as
          | "never"
          | "weekly"
          | "biweekly"
          | "monthly",
        startDate: profileData.availability.startDate,
        startTimeStr: profileData.availability.startTime,
        endTimeStr: profileData.availability.endTime,
        // Convert time strings to timestamp for the required fields
        startTime: createTimestamp(profileData.availability.startTime),
        endTime: createTimestamp(profileData.availability.endTime),
        ends: (profileData.availability.ends || "never") as
          | "never"
          | "on_date"
          | "after_occurrences",
        occurrences: profileData.availability.occurrences,
        endDate: profileData.availability.endDate || null,
        notes: `Onboarding availability - Hourly Rate: ${profileData.hourlyRate}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Save job title as a skill if provided
    if (profileData.jobTitle) {
      await db.insert(SkillsTable).values({
        workerProfileId: workerProfileId,
        name: profileData.jobTitle,
        experienceMonths: 0,
        experienceYears: 0,
        agreedRate: String(parseFloat(profileData.hourlyRate) || 0),
        skillVideoUrl: null,
        adminTags: null,
        ableGigs: null,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Debug: Log the equipment data received

    
    // Save equipment data if provided
    if (profileData.equipment && profileData.equipment.length > 0) {

      
      try {
        // Wrap delete and insert operations in a transaction for data integrity
        await db.transaction(async (tx) => {
          // Delete existing equipment for this worker

          await tx
            .delete(EquipmentTable)
            .where(eq(EquipmentTable.workerProfileId, workerProfileId));
          

          // Insert new equipment

          const insertResult = await tx.insert(EquipmentTable).values(
            (profileData.equipment as NonNullable<typeof profileData.equipment>).map(equipment => ({
              workerProfileId: workerProfileId,
              name: equipment.name,
              description: equipment.description || null,
              isVerifiedByAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            }))
          );
          
        });
      } catch (dbError) {

        throw dbError;
      }
    } else {

    }

    // Update user table to mark as gig worker
    await db
      .update(UsersTable)
      .set({
        isGigWorker: true,
        lastRoleUsed: "GIG_WORKER",
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, user.id));

    return { success: true, data: "Worker profile saved successfully", workerProfileId };
  } catch (error) {

    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
