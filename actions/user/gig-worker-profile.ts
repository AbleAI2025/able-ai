"use server";

import PublicWorkerProfile, {
  Availability,
  SemanticProfile,
} from "@/app/types/workerProfileTypes";
import { db } from "@/lib/drizzle/db";
import {
  EquipmentTable,
  GigWorkerProfilesTable,
  QualificationsTable,
  ReviewsTable,
  SkillsTable,
  UserBadgesLinkTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";


export const getPublicWorkerProfileAction = async (workerId: string) => {
    if (!workerId) throw "Worker ID is required"

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerId),
    });

    const data = await getGigWorkerProfile(workerProfile)

    return data
}

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
    });

    const data = await getGigWorkerProfile(workerProfile)

    return data
}
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
        where: eq(ReviewsTable.targetUserId, workerProfile.userId),
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
      availabilityJson: workerProfile?.availabilityJson as Availability,
      semanticProfileJson:
        workerProfile?.semanticProfileJson as SemanticProfile,
      averageRating,
      awards,
      equipment,
      skills,
      reviews,
      qualifications,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
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

    const badges = await db.query.UserBadgesLinkTable.findMany({
      where: eq(UserBadgesLinkTable.userId, workerProfile?.userId || ""),
    });

    const qualifications = await db.query.QualificationsTable.findMany({
      where: eq(QualificationsTable.workerProfileId, workerProfile?.id || ""),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(ReviewsTable.targetUserId, workerProfile?.userId || ""),
    });

    const reviewsData = await Promise.all(
      reviews.map(async (review) => {
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

    const skillProfile = {
      name: user?.fullName,
      title: skill?.name,
      hashtags: Array.isArray(workerProfile?.hashtags)
        ? workerProfile.hashtags.join(" ")
        : "",
      customerReviewsText: workerProfile?.fullBio,
      ableGigs: skill?.ableGigs,
      experienceYears: skill?.experienceMonths / 12,
      Eph: skill?.agreedRate,
      location: workerProfile?.location || "",
      address: workerProfile?.address || "",
      latitude: workerProfile?.latitude ?? 0,
      longitude: workerProfile?.longitude ?? 0,
      statistics: {
        reviews: reviews?.length,
        paymentsCollected: "£4899",
        tipsReceived: "£767",
      },
      supportingImages: ["/images/bar-action.svg", "/images/bar-action.svg"],
      badges,
      qualifications,
      buyerReviews: reviewsData,
    };

    return { success: true, data: skillProfile };
  } catch (error) {
    console.error(`Error fetching skill: ${error}`);
    return { success: false, data: null, error };
  }
};

export const updateVideoUrlProfileAction = async (
  videoUrl: string,
  token?: string | undefined
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

    if (!user) throw "User not found"

    await db
      .update(GigWorkerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(GigWorkerProfilesTable.userId, user?.id));

    return { success: true, data: "Url video updated successfully" };
  } catch (error) {
    console.log("Error saving video url", error);
    return { success: false, data: "Url video updated successfully", error };
  }
};

// New action to save complete worker profile from onboarding
export const saveWorkerProfileFromOnboardingAction = async (
  profileData: {
    about?: string;
    experience?: string;
    skills?: string;
    hourlyRate?: number;
    location?: { lat: number; lng: number } | string;
    availability?: {
      days: string[];
      startTime: string;
      endTime: string;
    } | string;
    time?: string;
    videoIntro?: string;
    references?: string;
  },
  token?: string
) => {
  try {
    if (!token) {
      throw new Error("Token is required to save worker profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    // Get or create worker profile
    let workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    if (!workerProfile) {
      // Create new worker profile if it doesn't exist
      const newProfiles = await db.insert(GigWorkerProfilesTable).values({
        userId: user.id,
      }).returning();
      workerProfile = newProfiles[0];
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Handle fullBio (combine about and experience)
    if (profileData.about || profileData.experience) {
      const bioParts = [];
      if (profileData.about) bioParts.push(profileData.about);
      if (profileData.experience) bioParts.push(profileData.experience);
      updateData.fullBio = bioParts.join('\n\n');
    }

    // Handle location
    if (profileData.location) {
      if (typeof profileData.location === 'object' && 'lat' in profileData.location && 'lng' in profileData.location) {
        // Handle coordinate object
        updateData.latitude = profileData.location.lat;
        updateData.longitude = profileData.location.lng;
        updateData.location = `Lat: ${profileData.location.lat.toFixed(6)}, Lng: ${profileData.location.lng.toFixed(6)}`;
      } else if (typeof profileData.location === 'string') {
        // Handle string location
        updateData.location = profileData.location;
      }
    }

    // Handle availability
    if (profileData.availability) {
      if (typeof profileData.availability === 'object' && 'days' in profileData.availability) {
        // New availability format
        updateData.availabilityJson = profileData.availability;
      } else if (typeof profileData.availability === 'string') {
        // Legacy string format - convert to new format
        updateData.availabilityJson = {
          days: [],
          startTime: '09:00',
          endTime: '17:00'
        };
      }
    }

    // Handle video URL
    if (profileData.videoIntro) {
      updateData.videoUrl = profileData.videoIntro;
    }

    // Handle skills and create semantic profile
    if (profileData.skills) {
      // Create semantic profile from skills
      const skillTags = profileData.skills
        .split(/[,\n]+/)
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      updateData.semanticProfileJson = {
        tags: skillTags
      };
    }

    // Handle hourly rate in private notes for now (could be moved to a separate field later)
    if (profileData.hourlyRate) {
      updateData.privateNotes = `Hourly Rate: £${profileData.hourlyRate}${profileData.time ? `\nPreferred Time: ${profileData.time}` : ''}`;
    }

    // Update the worker profile
    await db
      .update(GigWorkerProfilesTable)
      .set(updateData)
      .where(eq(GigWorkerProfilesTable.userId, user.id));

    // Also ensure user is marked as a gig worker
    await db
      .update(UsersTable)
      .set({
        isGigWorker: true,
        lastRoleUsed: "GIG_WORKER",
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.firebaseUid, uid));

    return { 
      success: true, 
      data: "Worker profile saved successfully",
      profileId: workerProfile.id 
    };
  } catch (error) {
    console.error("Error saving worker profile from onboarding:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to save worker profile" 
    };
  }
};
