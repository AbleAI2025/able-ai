"use server";

import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  GigWorkerProfilesTable,
  QualificationsTable,
  ReviewsTable,
  SkillsTable,
  UserBadgesLinkTable,
  UsersTable,
} from "@/lib/drizzle/schema";

import { isUserAuthenticated } from "@/lib/user.server";
import { and, eq } from "drizzle-orm";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";

export const getSkillDetailsWorker = async (id: string) => {
  try {
    const skill = await db.query.SkillsTable.findFirst({
      where: eq(SkillsTable.id, id),
    });

    if (!skill) throw new Error("Skill not found");

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, skill?.workerProfileId),
      with: { user: { columns: { fullName: true } } },
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found for the given skill.");
    }

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