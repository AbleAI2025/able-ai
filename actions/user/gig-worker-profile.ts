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
