"use server";

import PublicWorkerProfile, { Availability, SemanticProfile } from "@/app/types/workerProfileTypes";
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

export const getGigWorkerProfile = async (token: string): Promise<{ success: true; data: PublicWorkerProfile }> => {
  try {
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

    let skills;
    let equipment;
    let qualifications;

    if (workerProfile) {
      skills = await db.query.SkillsTable.findMany({
        where: eq(SkillsTable.workerProfileId, workerProfile.id),
      });

      equipment = await db.query.EquipmentTable.findMany({
        where: eq(EquipmentTable.workerProfileId, workerProfile.id),
      });

      qualifications = await db.query.QualificationsTable.findMany({
        where: eq(QualificationsTable.workerProfileId, workerProfile.id),
      });
    }

    const awards = await db.query.UserBadgesLinkTable.findMany({
      where: eq(UserBadgesLinkTable.userId, user.id),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(ReviewsTable.targetUserId, user.id),
    });

    const totalReviews = reviews.length;

    const positiveReviews = reviews?.filter((item) => item.rating === 1).length;

    const averageRating =
      totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

    const data = {
      ...workerProfile,
      fullBio: workerProfile?.fullBio ?? undefined,
      privateNotes: workerProfile?.privateNotes ?? undefined,
      responseRateInternal: workerProfile?.responseRateInternal ?? undefined,
      availabilityJson: workerProfile?.availabilityJson as Availability,
      semanticProfileJson: workerProfile?.semanticProfileJson as SemanticProfile,
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
