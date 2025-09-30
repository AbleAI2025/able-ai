"use server";

import PublicWorkerProfile, {
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
import { BadgeIcon } from "@/app/components/profile/GetBadgeIcon";

export const getPublicWorkerProfileAction = async (
  workerId: string,
  useUserId: boolean = false
) => {
  if (!workerId) throw "Worker ID is required";

  const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(
      useUserId ? GigWorkerProfilesTable.userId : GigWorkerProfilesTable.id,
      workerId
    ),
    with: { user: { columns: { fullName: true, rtwStatus: true } } },
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
    with: {
      user: { columns: { fullName: true, rtwStatus: true } },
      skills: true,
      qualifications: true,
      equipment: true,
    },
  });

  const data = await getGigWorkerProfile(workerProfile);

  return data;
};
export const getGigWorkerProfile = async (
  workerProfile:
    | (typeof GigWorkerProfilesTable.$inferSelect & {
        user?: { fullName: string; rtwStatus: string | null };
      })
    | undefined
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
        eq(UserBadgesLinkTable.badgeId, BadgeDefinitionsTable.id)
      )
      .where(eq(UserBadgesLinkTable.userId, workerProfile?.userId || ""));

    const badgeDetails = badges?.map((badge) => ({
      id: badge.id,
      name: badge.badge.name,
      description: badge.badge.description,
      icon: (badge.badge.icon ?? "") as BadgeIcon,
      type: badge.badge.type,
      awardedAt: badge.awardedAt,
      awardedBySystem: badge.awardedBySystem,
    }));

    const reviews = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM")
      ),
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED")
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
      hashtags: Array.isArray(workerProfile?.hashtags)
        ? workerProfile.hashtags
        : undefined,
      availabilityJson: undefined, // Set to undefined since we now use worker_availability table
      semanticProfileJson:
        workerProfile?.semanticProfileJson as SemanticProfile,
      averageRating,
      awards: badgeDetails,
      equipment,
      skills,
      reviews,
      recommendations,
      qualifications,
      user: { fullName: workerProfile?.user?.fullName || "" },
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
      with: { user: { columns: { fullName: true } } },
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
        eq(UserBadgesLinkTable.badgeId, BadgeDefinitionsTable.id)
      )
      .where(eq(UserBadgesLinkTable.userId, workerProfile?.userId || ""));

    const badgeDetails = badges?.map((badge) => ({
      id: badge.id,
      name: badge.badge.name,
      description: badge.badge.description,
      icon: badge.badge.icon,
      type: badge.badge.type,
      awardedAt: badge.awardedAt,
      awardedBySystem: badge.awardedBySystem,
    }));

    const qualifications = await db.query.QualificationsTable.findMany({
      where: and(
        eq(QualificationsTable.workerProfileId, workerProfile?.id || ""),
        eq(QualificationsTable.skillId, skill.id || "")
      ),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM")
      ),
      with: { author: { columns: { fullName: true } } },
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
        eq(ReviewsTable.skillId, skill.id)
      ),
      with: { author: { columns: { fullName: true } } },
    });

    const skillProfile = {
      workerProfileId: workerProfile?.id ?? "",
      socialLink: workerProfile?.socialLink,
      name: workerProfile?.user?.fullName,
      title: skill?.name,
      hashtags: Array.isArray(workerProfile?.hashtags)
        ? workerProfile.hashtags
        : [],
      customerReviewsText: "",
      ableGigs: skill?.ableGigs,
      experienceYears: skill?.experienceYears,
      Eph: skill?.agreedRate,
      location: workerProfile?.location || "",
      address: workerProfile?.address || "",
      latitude: workerProfile?.latitude ?? 0,
      longitude: workerProfile?.longitude ?? 0,
      videoUrl: workerProfile?.videoUrl || "",
      statistics: {
        reviews: Number(reviews?.length ?? 0),
        paymentsCollected: 0,
        tipsReceived: 0,
      },

      supportingImages: skill.images ?? [],
      badges: badgeDetails,
      qualifications,
      buyerReviews: reviews,
      recommendations: recommendations,
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
  }
) => {
  try {
    if (!token) throw new Error("Token is required");
    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw new Error("Unauthorized");

    // Validate hourly rate minimum
    const hourlyRate = parseFloat(String(agreedRate));
    if (hourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      throw new Error(
        `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`
      );
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
  token?: string | undefined
) => {
  try {
    console.log("🎥 Updating video URL:", videoUrl);

    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    console.log(
      "🎥 Updating video URL for user:",
      user.id,
      "with URL:",
      videoUrl
    );

    const result = await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user?.id))
      .returning();

    console.log("🎥 Video URL update result:", result);

    return { success: true, data: "Url video updated successfully" };
  } catch (error) {
    console.error("🎥 Video URL update error:", error);
    return { success: false, data: "Url video updated successfully", error };
  }
};

export const updateProfileImageAction = async (
  token: string,
  id: string,
  newImage: string
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
  imageUrl: string
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
  profileData: {
    about: string;
    experience: string;
    skills: string;
    qualifications?: string; // Add qualifications field
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
    hashtags?: string[]; // Add hashtags field
    videoIntro: File | string;
    jobTitle?: string; // Add job title field
    equipment?: { name: string; description?: string }[]; // Add equipment field
    experienceYears?: number; // Parsed years of experience
    experienceMonths?: number; // Parsed months of experience
  },
  token: string
) => {
        try {
    
    // Validate required fields
    if (!profileData.about || profileData.about.trim().length === 0) {
      throw new Error('About field is required');
    }
    if (!profileData.skills || profileData.skills.trim().length === 0) {
      throw new Error('Skills field is required');
    }
    if (!profileData.hourlyRate || profileData.hourlyRate.trim().length === 0) {
      throw new Error('Hourly rate field is required');
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
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    // Validate hourly rate minimum
    const validatedHourlyRate = parseFloat(profileData.hourlyRate || "0");
    if (validatedHourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
      throw new Error(
        `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`
      );
    }

            // Use provided hashtags (always provided by client)
            const generatedHashtags = profileData.hashtags || [];

            // Prepare profile data
    
    // Parse location coordinates if location is a string (from location picker)
    let latitude = null;
    let longitude = null;
    let locationText = '';
    
    if (typeof profileData.location === 'string') {
      locationText = profileData.location;
      // Try to extract coordinates from the location string if it contains them
      const coordMatch = profileData.location.match(/lat[:\s]*([0-9.-]+)[,\s]*lng[:\s]*([0-9.-]+)/i);
      if (coordMatch) {
        latitude = parseFloat(coordMatch[1]);
        longitude = parseFloat(coordMatch[2]);
      }
    } else if (typeof profileData.location === 'object' && profileData.location) {
      locationText = profileData.location.formatted_address || profileData.location.name || '';
      latitude = profileData.location.lat || null;
      longitude = profileData.location.lng || null;
            }

    const profileUpdateData = {
      fullBio: profileData.about,
      location: locationText,
      latitude: latitude,
      longitude: longitude,
      // Remove availabilityJson - we'll save to worker_availability table instead
      videoUrl: (() => {
        if (typeof profileData.videoIntro === "string") {
          return profileData.videoIntro;
        }
        return null;
      })(),
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
              if (workerProfile) {
                // Update existing profile
                const updateResult = await db
                  .update(GigWorkerProfilesTable)
                  .set(profileUpdateData)
                  .where(eq(GigWorkerProfilesTable.userId, user.id))
                  .returning();
                workerProfileId = workerProfile.id;
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
              throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
            }

            // Verify hashtags were saved
            const savedProfile = await db.query.GigWorkerProfilesTable.findFirst({
              where: eq(GigWorkerProfilesTable.userId, user.id),
            });

            // Save availability data to worker_availability table
    
    if (profileData.availability) {
      let availabilityData;
      
              // Parse availability if it's a JSON string
              if (typeof profileData.availability === "string") {
                try {
                  availabilityData = JSON.parse(profileData.availability);
                } catch (parseError) {
                  availabilityData = null;
                }
              } else if (typeof profileData.availability === "object") {
                availabilityData = profileData.availability;
              }
      
      if (availabilityData) {
        // Handle array format (from existing data) - use first item
        const availabilityObject = Array.isArray(availabilityData) ? availabilityData[0] : availabilityData;
        
        if (!availabilityObject) {
          throw new Error('Availability data is empty');
        }
        
        // Create proper timestamps for the required fields
        const createTimestamp = (timeStr: string) => {
          if (!timeStr) {
            throw new Error('Time string is required for createTimestamp');
          }
          const [hours, minutes] = timeStr.split(":").map(Number);
          const date = new Date();
          date.setHours(hours, minutes, 0, 0);
          return date;
        };


        await db.insert(WorkerAvailabilityTable).values({
          userId: user.id,
          days: availabilityObject.days || [],
          frequency: (availabilityObject.frequency || "weekly") as
            | "never"
            | "weekly"
            | "biweekly"
            | "monthly",
          startDate:
            availabilityObject.startDate ||
            new Date().toISOString().split("T")[0],
          startTimeStr: availabilityObject.startTime,
          endTimeStr: availabilityObject.endTime,
          // Convert time strings to timestamp for the required fields
          startTime: createTimestamp(availabilityObject.startTime),
          endTime: createTimestamp(availabilityObject.endTime),
          ends: (availabilityObject.ends || "never") as
            | "never"
            | "on_date"
            | "after_occurrences",
          occurrences: availabilityObject.occurrences,
          endDate: availabilityObject.endDate || null,
          notes: `Onboarding availability - Hourly Rate: ${profileData.hourlyRate}`,
          createdAt: new Date(),
          updatedAt: new Date(),
                });
              }
    }

    // Save worker skills data to gig_worker_skills table
    let skillName = "";
    let yearsOfExperience: number | undefined;
    let extractedHourlyRate: number | undefined;


    try {
      // Use skills field as the main skill for database entry
      skillName = profileData.skills || profileData.jobTitle || "";

      // Extract years of experience from experience field
      const experienceText = profileData.experience || "";
      
      // Try multiple patterns to extract years of experience
      let yearsMatch = experienceText.match(/(\d+)\s*(?:years?|yrs?|y)/i);
      
      // If no explicit years found, try to extract any number that might represent years
      if (!yearsMatch) {
        yearsMatch = experienceText.match(/(\d+)/);
      }
      
      // If still no number found, try to extract decimal numbers (e.g., "2.5 years")
      if (!yearsMatch) {
        yearsMatch = experienceText.match(/(\d+\.?\d*)/);
      }
      
      if (yearsMatch) {
        yearsOfExperience = parseFloat(yearsMatch[1]);
      } else {
        // If no number found at all, default to 0 (no experience)
        yearsOfExperience = 0;
        console.warn(`No years of experience found in: "${experienceText}"`);
      }

      // Extract hourly rate from form data
      extractedHourlyRate = profileData.hourlyRate
        ? parseFloat(profileData.hourlyRate)
        : validatedHourlyRate;


      if (skillName) {

        // Check if this specific skill already exists for this worker profile to prevent exact duplicates
        const existingSkills = await db.query.SkillsTable.findMany({
          where: eq(SkillsTable.workerProfileId, workerProfileId),
        });

        // Check if this exact skill name already exists
        const skillExists = existingSkills.some(
          (skill) =>
            skill.name.toLowerCase().trim() === skillName.toLowerCase().trim()
        );

        if (!skillExists) {
          // Skill doesn't exist, safe to insert
          try {
            const skillResult = await db.insert(SkillsTable).values({
              workerProfileId: workerProfileId,
              name: skillName,
              experienceMonths: 0,
              experienceYears: yearsOfExperience || 0,
              agreedRate: String(extractedHourlyRate || validatedHourlyRate),
              skillVideoUrl:
                typeof profileData.videoIntro === "string"
                  ? profileData.videoIntro
                  : null,
              adminTags: profileData.hashtags || null,
              ableGigs: null,
              images: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          } catch (insertError) {
            throw insertError;
          }
        }
      }

      // Save qualifications data to qualifications table (only after skills are saved)
      if (
        profileData.qualifications &&
        profileData.qualifications.trim().length > 0
      ) {
        // Parse qualifications from the text input
        // Split by common delimiters and clean up
        const qualificationsList = profileData.qualifications
          .split(/[,\n;]/)
          .map((qual) => qual.trim())
          .filter((qual) => qual.length > 0);

        // Get existing qualifications to avoid duplicates
        const existingQualifications =
          await db.query.QualificationsTable.findMany({
            where: eq(QualificationsTable.workerProfileId, workerProfileId),
          });

        // Get all skills for this worker to match qualifications
        const workerSkills = await db.query.SkillsTable.findMany({
          where: eq(SkillsTable.workerProfileId, workerProfileId),
        });

        // Process qualifications and filter out duplicates
        const qualificationsToInsert = [];
        const processedTitles = new Set<string>();

        for (const qualification of qualificationsList) {
          // Try to extract year from qualification text (e.g., "Bachelor's Degree 2020")
          const yearMatch = qualification.match(/(\d{4})/);
          const yearAchieved = yearMatch ? parseInt(yearMatch[1]) : null;

          // Try to extract institution (basic pattern matching)
          const institutionMatch = qualification.match(
            /(?:from|at|@)\s+([^,]+)/i
          );
          const institution = institutionMatch
            ? institutionMatch[1].trim()
            : null;

          // Clean up the title by removing year and institution
          let title = qualification;
          if (yearMatch) {
            title = title.replace(/\d{4}/, "").trim();
          }
          if (institutionMatch) {
            title = title.replace(/(?:from|at|@)\s+[^,]+/i, "").trim();
          }

          const normalizedTitle = title.toLowerCase().trim();

          // Check if this qualification already exists (case-insensitive)
          const qualificationExists = existingQualifications.some(
            (existing) =>
              existing.title.toLowerCase().trim() === normalizedTitle
          );

          // Also check if we've already processed this title in the current batch
          const alreadyProcessed = processedTitles.has(normalizedTitle);


          if (!qualificationExists && !alreadyProcessed) {
            // Since there's only one skill (the job title), connect all qualifications to it
            // This ensures qualifications are always linked to the worker's main skill
            const matchedSkill = workerSkills.length > 0 ? workerSkills[0] : null;


            qualificationsToInsert.push({
              workerProfileId: workerProfileId,
              title: title || qualification, // Fallback to original if cleaning fails
              institution: institution,
              yearAchieved: yearAchieved,
              description: null, // Could be enhanced to extract more details
              documentUrl: null, // Could be enhanced to handle document uploads
              isVerifiedByAdmin: false,
              skillId: matchedSkill?.id || null, // Link to matched skill if found
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            processedTitles.add(normalizedTitle);
          }
        }

        // Insert only new qualifications
        if (qualificationsToInsert.length > 0) {
          await db.insert(QualificationsTable).values(qualificationsToInsert);
        }

      }
    } catch (skillError) {
      // Don't fail the entire profile save if skills saving fails
    }

    // Save equipment data if provided
    if (profileData.equipment && profileData.equipment.length > 0) {
      try {

        // Get existing equipment to avoid duplicates
        const existingEquipment = await db.query.EquipmentTable.findMany({
          where: eq(EquipmentTable.workerProfileId, workerProfileId),
        });

        // Filter out duplicates and prepare equipment for insertion
        const equipmentToInsert = [];
        const processedNames = new Set<string>();

        for (const equipment of profileData.equipment as NonNullable<
          typeof profileData.equipment
        >) {
          const normalizedName = equipment.name.toLowerCase().trim();

          // Check if this equipment already exists (case-insensitive)
          const equipmentExists = existingEquipment.some(
            (existing) => existing.name.toLowerCase().trim() === normalizedName
          );

          // Also check if we've already processed this name in the current batch
          const alreadyProcessed = processedNames.has(normalizedName);

          if (!equipmentExists && !alreadyProcessed) {
            equipmentToInsert.push({
              workerProfileId: workerProfileId,
              name: equipment.name,
              description: equipment.description || null,
              isVerifiedByAdmin: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            processedNames.add(normalizedName);
          }
        }

        // Insert only new equipment
        if (equipmentToInsert.length > 0) {
          await db.insert(EquipmentTable).values(equipmentToInsert);
        }
      } catch (dbError) {
        throw dbError;
      }
    }

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

export const updateSocialLinkWorkerProfileAction = async (
  socialLink: string,
  token?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!token) {
      return { success: false, error: "User token is required" };
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) return { success: false, error: "Unauthorized" };

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });
    if (!user) return { success: false, error: "User not found" };

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