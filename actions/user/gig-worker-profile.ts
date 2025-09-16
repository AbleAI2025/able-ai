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
    with: { user: { columns: { fullName: true, rtwStatus: true } } },
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
      hashtags: Array.isArray(workerProfile?.hashtags) ? workerProfile.hashtags : undefined,
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
      with: {user: {columns: {fullName: true}}}
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
      with: {author: {columns: {fullName: true}}}
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
        eq(ReviewsTable.skillId, skill.id)
      ),
      with: {author: {columns: {fullName: true}}}
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
        reviews: Number( reviews?.length ?? 0),
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
    console.log('🎥 Updating video URL:', videoUrl);
    
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    console.log('🎥 Updating video URL for user:', user.id, 'with URL:', videoUrl);

    const result = await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user?.id))
      .returning();

    console.log('🎥 Video URL update result:', result);

    return { success: true, data: "Url video updated successfully" };
  } catch (error) {
    console.error('🎥 Video URL update error:', error);
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
    videoIntro: File | string;
    jobTitle?: string; // Add job title field
    equipment?: { name: string; description?: string }[]; // Add equipment field
    experienceYears?: number; // Parsed years of experience
    experienceMonths?: number; // Parsed months of experience
    hashtags?: string[]; // Add hashtags field for client-generated hashtags
  },
  token: string
) => {
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
    console.log('✅ Using client-generated hashtags:', generatedHashtags);

    // Prepare profile data
    console.log('🎥 Video intro data in save function:', {
      videoIntro: profileData.videoIntro,
      type: typeof profileData.videoIntro,
      isString: typeof profileData.videoIntro === 'string'
    });
    
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
      videoUrl: (() => {
        if (typeof profileData.videoIntro === "string") {
          return profileData.videoIntro;
        }
        return null;
      })(),
      hashtags: generatedHashtags.length > 0 ? generatedHashtags : [
        `#${profileData.skills?.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-') || 'worker'}`,
        `#${profileData.about?.split(' ')[0]?.toLowerCase() || 'professional'}`,
        '#gig-worker'
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
    
    console.log('💾 Profile update data with hashtags:', {
      hashtags: profileUpdateData.hashtags,
      hashtagsType: typeof profileUpdateData.hashtags,
      hashtagsLength: Array.isArray(profileUpdateData.hashtags) ? profileUpdateData.hashtags.length : 'not array',
      hashtagsStringified: JSON.stringify(profileUpdateData.hashtags),
      isUsingFallback: generatedHashtags.length === 0
    });

    let workerProfileId: string;

    if (workerProfile) {
      // Update existing profile
      console.log('🔄 Updating existing worker profile with hashtags...');
      console.log('📝 Data being sent to database update:', {
        hashtags: profileUpdateData.hashtags,
        hashtagsType: typeof profileUpdateData.hashtags,
        isArray: Array.isArray(profileUpdateData.hashtags)
      });
      const updateResult = await db
        .update(GigWorkerProfilesTable)
        .set(profileUpdateData)
        .where(eq(GigWorkerProfilesTable.userId, user.id))
        .returning();
      console.log('🔄 Database update result:', updateResult);
      workerProfileId = workerProfile.id;
    } else {
      // Create new profile
      console.log('➕ Creating new worker profile with hashtags...');
      console.log('📝 Data being sent to database insert:', {
        hashtags: profileUpdateData.hashtags,
        hashtagsType: typeof profileUpdateData.hashtags,
        isArray: Array.isArray(profileUpdateData.hashtags)
      });
      const newProfile = await db
        .insert(GigWorkerProfilesTable)
        .values({
          userId: user.id,
          ...profileUpdateData,
          createdAt: new Date(),
        })
        .returning();
      console.log('➕ Database insert result:', newProfile);
      workerProfileId = newProfile[0].id;
    }
    
    // Verify hashtags were saved
    const savedProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id)
    });
    console.log('✅ Verified saved hashtags in database:', {
      hashtags: savedProfile?.hashtags,
      hashtagsType: typeof savedProfile?.hashtags,
      isArray: Array.isArray(savedProfile?.hashtags),
      length: Array.isArray(savedProfile?.hashtags) ? savedProfile.hashtags.length : 'not array',
      fullProfile: savedProfile
    });

    // Also try a direct SQL query to see what's in the database
    try {
      const directQuery = await db.execute(sql`
        SELECT hash_tags FROM gig_worker_profiles 
        WHERE user_id = ${user.id}
      `);
      console.log('🔍 Direct SQL query result:', directQuery);
    } catch (error) {
      console.error('❌ Direct SQL query failed:', error);
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

      console.log('📅 Saving availability data to database:', {
        days: profileData.availability.days,
        frequency: profileData.availability.frequency,
        startDate: profileData.availability.startDate,
        startTime: profileData.availability.startTime,
        endTime: profileData.availability.endTime,
        ends: profileData.availability.ends
      });

      await db.insert(WorkerAvailabilityTable).values({
        userId: user.id,
        days: profileData.availability.days || [],
        frequency: (profileData.availability.frequency || "weekly") as
          | "never"
          | "weekly"
          | "biweekly"
          | "monthly",
        startDate: profileData.availability.startDate || new Date().toISOString().split('T')[0],
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

      console.log('✅ Availability data saved successfully to worker_availability table');
    }

    // Save worker skills data to gig_worker_skills table
    let skillName = "";
    let yearsOfExperience: number | undefined;
    let extractedHourlyRate: number | undefined;

    // Add unique call identifier for debugging
    const callId = Math.random().toString(36).substr(2, 9);
    console.log(`🚀 [${callId}] Starting worker skills save process...`);
    console.log(`🚀 [${callId}] Profile data received:`, {
      hasJobTitle: !!profileData.jobTitle,
      hasAbout: !!profileData.about,
      hasExperience: !!profileData.experience,
      hasHourlyRate: !!profileData.hourlyRate,
      jobTitle: profileData.jobTitle,
      about: profileData.about,
      experience: profileData.experience,
      hourlyRate: profileData.hourlyRate,
    });

    // Log call stack to see where this is being called from
    console.log(`🚀 [${callId}] Call stack:`, new Error().stack?.split('\n').slice(1, 4).join('\n'));
    
    try {
      // Use jobTitle field as the main skill for database entry (not the skills form field)
      skillName = profileData.jobTitle || profileData.about || '';
      
      // Extract years of experience from experience field
      const experienceText = profileData.experience || '';
      const yearsMatch = experienceText.match(/(\d+)\s*(?:years?|yrs?|y)/i);
      yearsOfExperience = yearsMatch ? parseFloat(yearsMatch[1]) : undefined;
      
      // Extract hourly rate from form data
      extractedHourlyRate = profileData.hourlyRate ? parseFloat(profileData.hourlyRate) : validatedHourlyRate;
      
      console.log('🔍 Worker Skills Debug:', {
        skillName,
        yearsOfExperience,
        hourlyRate: extractedHourlyRate,
        validatedHourlyRate,
        workerProfileId,
        user_id: user.id,
        worker_profile_id: workerProfileId,
        profileData_keys: Object.keys(profileData),
        profileData_values: Object.values(profileData),
        hasSkillName: !!skillName,
        about_field: profileData.about,
        experience_field: profileData.experience,
        hourlyRate_field: profileData.hourlyRate,
        note: 'Using jobTitle field as main skill for database entry (skills form field ignored)'
      });

      if (skillName) {
        console.log("💾 Attempting to save worker skills...");
        console.log("📝 Insert data:", {
          userId: user.id,
          name: skillName,
          experience: yearsOfExperience ? String(yearsOfExperience) : null,
          eph: extractedHourlyRate ? String(extractedHourlyRate) : null,
        });

        // Check if this specific skill already exists for this worker profile to prevent exact duplicates
        const existingSkills = await db.query.SkillsTable.findMany({
          where: eq(SkillsTable.workerProfileId, workerProfileId),
        });
        console.log("🔍 Existing skills for worker profile:", existingSkills);

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
              skillVideoUrl: typeof profileData.videoIntro === 'string' ? profileData.videoIntro : null,
              adminTags: null,
              ableGigs: null,
              images: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            console.log("✅ New worker skill saved successfully:", skillResult);
          } catch (insertError) {
            console.error(
              "❌ Error inserting skill into SkillsTable:",
              insertError
            );
            console.error("❌ Insert data that failed:", {
              workerProfileId,
              name: skillName,
              experienceMonths: 0,
              experienceYears: yearsOfExperience || 0,
              agreedRate: String(extractedHourlyRate || validatedHourlyRate),
            });
            throw insertError;
          }
        } else {
          console.log(
            "⚠️ Skill already exists for this worker profile, skipping insert to prevent exact duplicates"
          );
          console.log(
            "📋 Existing skills:",
            existingSkills.map((s) => ({
              name: s.name,
              experienceYears: s.experienceYears,
              agreedRate: s.agreedRate,
            }))
          );
          console.log("🔍 Attempted to add skill:", skillName);
        }
      } else {
        console.log('⚠️ No jobTitle or about field found, skipping worker skills save');
        console.log('🔍 Available data:', {
          about: profileData.about,
          experience: profileData.experience,
          hourlyRate: profileData.hourlyRate,
          note: 'Using jobTitle field as main skill for database entry (skills form field ignored)'
        });
      }

      // Save qualifications data to qualifications table (only after skills are saved)
      if (profileData.qualifications && profileData.qualifications.trim().length > 0) {
        console.log('🎓 Saving qualifications data to database...');
        
        // Parse qualifications from the text input
        // Split by common delimiters and clean up
        const qualificationsList = profileData.qualifications
          .split(/[,\n;]/)
          .map(qual => qual.trim())
          .filter(qual => qual.length > 0);

        console.log('🎓 Parsed qualifications:', qualificationsList);

        // Get existing qualifications to avoid duplicates
        const existingQualifications = await db.query.QualificationsTable.findMany({
          where: eq(QualificationsTable.workerProfileId, workerProfileId),
        });

        console.log('🎓 Existing qualifications in database:', existingQualifications.map(q => ({ id: q.id, title: q.title })));

        // Get all skills for this worker to match qualifications
        const workerSkills = await db.query.SkillsTable.findMany({
          where: eq(SkillsTable.workerProfileId, workerProfileId),
        });

        console.log('🛠️ Available skills for matching:', workerSkills.map(s => ({ id: s.id, name: s.name })));

        // Process qualifications and filter out duplicates
        const qualificationsToInsert = [];
        const processedTitles = new Set<string>();

        for (const qualification of qualificationsList) {
          // Try to extract year from qualification text (e.g., "Bachelor's Degree 2020")
          const yearMatch = qualification.match(/(\d{4})/);
          const yearAchieved = yearMatch ? parseInt(yearMatch[1]) : null;
          
          // Try to extract institution (basic pattern matching)
          const institutionMatch = qualification.match(/(?:from|at|@)\s+([^,]+)/i);
          const institution = institutionMatch ? institutionMatch[1].trim() : null;
          
          // Clean up the title by removing year and institution
          let title = qualification;
          if (yearMatch) {
            title = title.replace(/\d{4}/, '').trim();
          }
          if (institutionMatch) {
            title = title.replace(/(?:from|at|@)\s+[^,]+/i, '').trim();
          }
          
          const normalizedTitle = title.toLowerCase().trim();
          
          // Check if this qualification already exists (case-insensitive)
          const qualificationExists = existingQualifications.some(
            (existing) => existing.title.toLowerCase().trim() === normalizedTitle
          );
          
          // Also check if we've already processed this title in the current batch
          const alreadyProcessed = processedTitles.has(normalizedTitle);
          
          console.log(`🔍 Checking qualification: "${qualification}"`, {
            normalizedTitle,
            qualificationExists,
            alreadyProcessed,
            existingTitles: existingQualifications.map(q => q.title.toLowerCase().trim())
          });
          
          if (!qualificationExists && !alreadyProcessed) {
            // Try to match this qualification to an existing skill
            const matchedSkill = workerSkills.find(skill => {
              const skillName = skill.name.toLowerCase().trim();
              const qualTitle = normalizedTitle;
              
              // More flexible matching logic
              const matches = [
                // Exact match
                skillName === qualTitle,
                // One contains the other
                skillName.includes(qualTitle) || qualTitle.includes(skillName),
                // Check for common skill-related keywords
                (qualTitle.includes('degree') && skillName.includes('education')),
                (qualTitle.includes('certificate') && skillName.includes('certification')),
                (qualTitle.includes('diploma') && skillName.includes('education')),
                (qualTitle.includes('bachelor') && skillName.includes('education')),
                (qualTitle.includes('master') && skillName.includes('education')),
                (qualTitle.includes('phd') && skillName.includes('education')),
                (qualTitle.includes('doctorate') && skillName.includes('education')),
                // Check for common professional terms
                (qualTitle.includes('engineer') && skillName.includes('engineering')),
                (qualTitle.includes('developer') && skillName.includes('development')),
                (qualTitle.includes('designer') && skillName.includes('design')),
                (qualTitle.includes('manager') && skillName.includes('management')),
                (qualTitle.includes('analyst') && skillName.includes('analysis')),
                (qualTitle.includes('consultant') && skillName.includes('consulting')),
                // Check for technology matches
                (qualTitle.includes('javascript') && skillName.includes('javascript')),
                (qualTitle.includes('python') && skillName.includes('python')),
                (qualTitle.includes('java') && skillName.includes('java')),
                (qualTitle.includes('react') && skillName.includes('react')),
                (qualTitle.includes('node') && skillName.includes('node')),
                (qualTitle.includes('sql') && skillName.includes('sql')),
                (qualTitle.includes('database') && skillName.includes('database')),
                // Check for partial word matches (more lenient)
                skillName.split(' ').some(word => qualTitle.includes(word) && word.length > 3),
                qualTitle.split(' ').some(word => skillName.includes(word) && word.length > 3),
              ];
              
              return matches.some(match => match);
            });
            
            console.log(`🔍 Qualification matching for "${qualification}":`, {
              title: title || qualification,
              matchedSkill: matchedSkill ? { id: matchedSkill.id, name: matchedSkill.name } : null,
              availableSkills: workerSkills.map(s => ({ id: s.id, name: s.name }))
            });
            
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
          } else {
            console.log(`⏭️ Skipping duplicate qualification: "${qualification}"`);
          }
        }

        // Insert only new qualifications
        if (qualificationsToInsert.length > 0) {
          console.log('🎓 Inserting new qualifications:', qualificationsToInsert.map(q => ({ title: q.title, skillId: q.skillId })));
          await db.insert(QualificationsTable).values(qualificationsToInsert);
          console.log(`✅ Inserted ${qualificationsToInsert.length} new qualifications`);
        } else {
          console.log('ℹ️ No new qualifications to insert (all were duplicates)');
        }
        
        // Final check - show all qualifications after processing
        const finalQualifications = await db.query.QualificationsTable.findMany({
          where: eq(QualificationsTable.workerProfileId, workerProfileId),
        });
        console.log('🎓 Final qualifications in database:', finalQualifications.map(q => ({ id: q.id, title: q.title, skillId: q.skillId })));
      } else {
        console.log('🎓 No qualifications provided, skipping qualifications save');
      }
    } catch (skillError) {
      console.error("❌ Error saving worker skills:", skillError);
      console.error("❌ Error details:", {
        message:
          skillError instanceof Error ? skillError.message : "Unknown error",
        stack:
          skillError instanceof Error ? skillError.stack : "No stack trace",
        skillName: skillName || "undefined",
        userId: user.id,
      });
      // Don't fail the entire profile save if skills saving fails
    }

    // Debug: Log the equipment data received

    // Save equipment data if provided
    if (profileData.equipment && profileData.equipment.length > 0) {
      try {
        console.log('🔧 Processing equipment:', profileData.equipment);
        
        // Get existing equipment to avoid duplicates
        const existingEquipment = await db.query.EquipmentTable.findMany({
          where: eq(EquipmentTable.workerProfileId, workerProfileId),
        });

        // Filter out duplicates and prepare equipment for insertion
        const equipmentToInsert = [];
        const processedNames = new Set<string>();

        for (const equipment of profileData.equipment as NonNullable<typeof profileData.equipment>) {
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
            console.log(`✅ Adding new equipment: ${equipment.name}`);
          } else {
            console.log(`⚠️ Equipment already exists or duplicate in batch, skipping: ${equipment.name}`);
          }
        }

        // Insert only new equipment
        if (equipmentToInsert.length > 0) {
          await db.insert(EquipmentTable).values(equipmentToInsert);
          console.log(`✅ Inserted ${equipmentToInsert.length} new equipment items`);
        } else {
          console.log('ℹ️ No new equipment to insert (all were duplicates)');
        }
      } catch (dbError) {
        console.error('❌ Error processing equipment:', dbError);
        throw dbError;
      }
    } else {
      console.log('ℹ️ No equipment provided');
    }

    // Skills field is ignored - only jobTitle is saved as THE skill
    console.log('ℹ️ Skills field ignored - using jobTitle as THE skill only');

    // Job title is already saved as THE skill above - no duplicate saving needed
    console.log('ℹ️ Job title already saved as THE skill - no duplicate saving needed');

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
