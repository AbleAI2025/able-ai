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
import { geminiAIAgent } from '@/lib/firebase/ai';
import { Schema } from '@firebase/ai';
import { BadgeIcon } from "@/app/components/profile/GetBadgeIcon";

// AI Hashtag Generation Schema
const hashtagGenerationSchema = Schema.object({
  properties: {
    hashtags: Schema.array({
      items: Schema.string(),
      maxItems: 3,
      minItems: 1
    })
  },
  required: ["hashtags"],
  additionalProperties: false
});


// AI function to generate hashtags from onboarding data
async function generateHashtagsFromOnboarding(profileData: {
  about: string;
  experience: string;
  skills: string;
  equipment?: { name: string; description?: string }[];
  location?: any;
}): Promise<string[]> {
  console.log('🚀 Starting hashtag generation with data:', profileData);
  try {
    const prompt = `You are an AI assistant that generates professional hashtags for gig workers based on their profile information.

Based on the following worker profile data, generate exactly 3 relevant, professional hashtags that would help with job matching and discoverability.

Profile Data:
- About: ${profileData.about || 'Not provided'}
- Experience: ${profileData.experience || 'Not provided'}
- Skills: ${profileData.skills || 'Not provided'}
- Equipment: ${profileData.equipment?.map(e => e.name).join(', ') || 'Not provided'}
- Location: ${typeof profileData.location === 'string' ? profileData.location : 'Not provided'}

Rules:
1. Generate exactly 3 hashtags (no more, no less)
2. Use professional, industry-standard terms
3. Focus on skills, experience level, and specializations
4. Use hashtag format (e.g., "#bartender", "#mixology", "#events")
5. Make them relevant to hospitality, events, and gig work
6. Avoid generic terms like "#work" or "#job"
7. Consider the worker's experience level and equipment

Examples of good hashtags:
- For bartenders: "#bartender", "#mixology", "#cocktails"
- For chefs: "#chef", "#cooking", "#catering"
- For event staff: "#events", "#hospitality", "#customer-service"

Generate 3 relevant hashtags for this worker:`;

    console.log('🤖 Calling Gemini AI for hashtag generation...');
    const result = await geminiAIAgent(
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
      {
        prompt,
        responseSchema: hashtagGenerationSchema,
      },
      null, // No injected AI for server-side calls
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
    );

    if (result.ok && result.data) {
      const hashtags = (result.data as { hashtags: string[] }).hashtags;
      console.log('✅ Generated hashtags via AI:', hashtags);
      console.log('🔍 Hashtags details:', {
        type: typeof hashtags,
        isArray: Array.isArray(hashtags),
        length: hashtags?.length,
        content: hashtags
      });
      return hashtags;
    } else {
      console.error('❌ AI generation failed:', result);
      // Fallback to basic hashtags
      return [
        `#${profileData.skills?.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-') || 'worker'}`,
        `#${profileData.about?.split(' ')[0]?.toLowerCase() || 'professional'}`,
        '#gig-worker'
      ];
    }
  } catch (error) {
    console.error('❌ Error generating hashtags:', error);
    // Fallback to basic hashtags
    return [
      `#${profileData.skills?.split(',')[0]?.trim().toLowerCase().replace(/\s+/g, '-') || 'worker'}`,
      `#${profileData.about?.split(' ')[0]?.toLowerCase() || 'professional'}`,
      '#gig-worker'
    ];
  }
}

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
      icon: (badge.badge.icon ?? "goldenVibes") as BadgeIcon,
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
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
        eq(ReviewsTable.skillId, skill.id)
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
      })
    );

    const recommendationsData = await Promise.all(
      recommendations.map(async (recommendation) => {
        return {
          name: recommendation.recommenderName,
          date: recommendation.createdAt,
          text: recommendation.comment,
        };
      })
    );

    const skillProfile = {
      workerProfileId: workerProfile?.id ?? "",
      name: user?.fullName,
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
        reviews: reviews?.length,
        paymentsCollected: "£0",
        tipsReceived: "£0",
      },
      supportingImages: skill.images ?? [],
      badges: badgeDetails,
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

    // Generate AI hashtags from onboarding data
    console.log('🤖 Generating AI hashtags from onboarding data...');
    console.log('📊 Profile data for hashtag generation:', {
      about: profileData.about,
      experience: profileData.experience,
      skills: profileData.skills,
      equipment: profileData.equipment,
      location: profileData.location
    });
    
    const generatedHashtags = await generateHashtagsFromOnboarding({
      about: profileData.about,
      experience: profileData.experience,
      skills: profileData.skills,
      equipment: profileData.equipment,
      location: profileData.location,
    });
    
    console.log('🔍 Generated hashtags result:', {
      hashtags: generatedHashtags,
      length: generatedHashtags.length,
      type: typeof generatedHashtags,
      isArray: Array.isArray(generatedHashtags),
      isEmpty: generatedHashtags.length === 0,
      willUseFallback: generatedHashtags.length === 0
    });

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
        // Use jobTitle field as the main skill for database entry
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
        note: 'Using jobTitle field as main skill for database entry'
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
              skillVideoUrl: null,
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
        console.log('⚠️ No about field found, skipping worker skills save');
        console.log('🔍 Available data:', {
          about: profileData.about,
          experience: profileData.experience,
          hourlyRate: profileData.hourlyRate,
          note: 'Using jobTitle field as main skill for database entry'
        });
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
        // Wrap delete and insert operations in a transaction for data integrity
        await db.transaction(async (tx) => {
          // Delete existing equipment for this worker
          await tx
            .delete(EquipmentTable)
            .where(eq(EquipmentTable.workerProfileId, workerProfileId));

          // Insert new equipment
          const insertResult = await tx.insert(EquipmentTable).values(
            (
              profileData.equipment as NonNullable<typeof profileData.equipment>
            ).map((equipment) => ({
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
      // No equipment provided
    }

    // Save qualifications data to qualifications table
    if (profileData.qualifications && profileData.qualifications.trim().length > 0) {
      try {
        console.log('🎓 Saving qualifications data to database...');
        
        // Parse qualifications from comma-separated string
        const qualificationsList = profileData.qualifications
          .split(',')
          .map(qual => qual.trim())
          .filter(qual => qual.length > 0);

        console.log('🎓 Parsed qualifications:', qualificationsList);

        // Wrap delete and insert operations in a transaction for data integrity
        await db.transaction(async (tx) => {
          // Delete existing qualifications for this worker
          await tx
            .delete(QualificationsTable)
            .where(eq(QualificationsTable.workerProfileId, workerProfileId));

          // Insert new qualifications
          if (qualificationsList.length > 0) {
            const qualificationsToInsert = qualificationsList.map((qualification) => {
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
              
              return {
                workerProfileId: workerProfileId,
                title: title || qualification, // Fallback to original if cleaning fails
                institution: institution,
                yearAchieved: yearAchieved,
                description: null, // Could be enhanced to extract more details
                documentUrl: null, // Could be enhanced to handle document uploads
                isVerifiedByAdmin: false,
                skillId: null, // Could be enhanced to link to specific skills
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            });

            console.log('🎓 Inserting qualifications:', qualificationsToInsert);
            
            const insertResult = await tx.insert(QualificationsTable).values(qualificationsToInsert);
            console.log('✅ Qualifications saved successfully:', insertResult);
          }
        });
      } catch (dbError) {
        console.error('❌ Error saving qualifications:', dbError);
        // Don't fail the entire profile save if qualifications saving fails
      }
    } else {
      console.log('🎓 No qualifications provided, skipping qualifications save');
    }

    // Save job title as a skill if provided (check for duplicates first)
    if (profileData.jobTitle) {
      // Check if this job title already exists as a skill for this worker profile
      const existingJobTitleSkills = await db.query.SkillsTable.findMany({
        where: eq(SkillsTable.workerProfileId, workerProfileId),
      });

      const jobTitleExists = existingJobTitleSkills.some(
        (skill) =>
          skill.name.toLowerCase().trim() ===
          (profileData.jobTitle || "").toLowerCase().trim()
      );

      if (!jobTitleExists) {
        try {
          await db.insert(SkillsTable).values({
            workerProfileId: workerProfileId,
            name: profileData.jobTitle,
            experienceMonths: 0,
            experienceYears: 0,
            agreedRate: String(
              parseFloat(profileData.hourlyRate) ||
                VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE
            ),
            skillVideoUrl: null,
            adminTags: null,
            ableGigs: null,
            images: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          console.log("✅ Job title saved as new skill:", profileData.jobTitle);
        } catch (insertError) {
          console.error("❌ Error inserting job title as skill:", insertError);
          console.error("❌ Job title insert data that failed:", {
            workerProfileId,
            name: profileData.jobTitle,
            agreedRate: String(
              parseFloat(profileData.hourlyRate) ||
                VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE
            ),
          });
          throw insertError;
        }
      } else {
        console.log(
          "⚠️ Job title already exists as skill, skipping insert:",
          profileData.jobTitle
        );
      }
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
