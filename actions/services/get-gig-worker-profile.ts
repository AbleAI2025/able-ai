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
import { and, eq } from "drizzle-orm";
import type {
  AvailabilityData,
  EquipmentData,
} from "../types/get-gig-worker-profile";
import { createTimestamp } from "../utils/get-gig-worker-profile";

export class GigWorkerProfileService {
  /**
   * Fetches all worker profile related data in parallel
   */
  static async fetchWorkerProfileData(workerProfile: typeof GigWorkerProfilesTable.$inferSelect) {
    const [
      skills,
      equipment,
      qualifications,
      awards,
      reviews,
      recommendations,
    ] = await Promise.all([
      db.query.SkillsTable.findMany({
        where: eq(SkillsTable.workerProfileId, workerProfile.id),
      }),
      db.query.EquipmentTable.findMany({
        where: eq(EquipmentTable.workerProfileId, workerProfile.id),
      }),
      db.query.QualificationsTable.findMany({
        where: eq(QualificationsTable.workerProfileId, workerProfile.id),
      }),
      db.query.UserBadgesLinkTable.findMany({
        where: eq(UserBadgesLinkTable.userId, workerProfile.userId),
      }),
      this.fetchInternalReviews(workerProfile.userId),
      this.fetchExternalRecommendations(workerProfile.userId),
    ]);

    return {
      skills,
      equipment,
      qualifications,
      awards,
      reviews,
      recommendations,
    };
  }

  /**
   * Fetches internal platform reviews
   */
  static async fetchInternalReviews(userId: string) {
    return await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, userId),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM")
      ),
    });
  }

  /**
   * Fetches external recommendations
   */
  static async fetchExternalRecommendations(userId: string, skillId?: string) {
    const conditions = [
      eq(ReviewsTable.targetUserId, userId),
      eq(ReviewsTable.type, "EXTERNAL_REQUESTED"),
    ];

    if (skillId) {
      conditions.push(eq(ReviewsTable.skillId, skillId));
    }

    return await db.query.ReviewsTable.findMany({
      where: and(...conditions),
    });
  }

  /**
   * Fetches badges with their definitions
   */
  static async fetchBadgesWithDefinitions(userId: string) {
    return await db
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
      .where(eq(UserBadgesLinkTable.userId, userId));
  }

  /**
   * Processes reviews data with author information
   */
  static async processReviewsData(reviews: any[]) {
    // 1. Obtener todos los IDs únicos de autores
    const authorIds = [
      ...new Set(reviews.map((review) => review.authorUserId).filter(Boolean)),
    ];

    // 2. Si no hay IDs, procesar directamente
    if (authorIds.length === 0) {
      return reviews.map((review) => ({
        name: "Unknown",
        date: review.createdAt,
        text: review.comment,
      }));
    }

    // 3. Hacer múltiples consultas en paralelo (mejor que secuencial)
    const authors = await Promise.all(
      authorIds.map((id) =>
        db.query.UsersTable.findFirst({
          where: eq(UsersTable.id, id),
        })
      )
    );

    // 4. Crear mapa para acceso rápido
    const authorsMap = new Map();
    authors.forEach((author, index) => {
      if (author) {
        authorsMap.set(authorIds[index], author);
      }
    });

    // 5. Procesar reviews
    return reviews.map((review) => {
      const author = authorsMap.get(review.authorUserId);
      return {
        name: author?.fullName || "Unknown",
        date: review.createdAt,
        text: review.comment,
      };
    });
  }

  /**
   * Processes recommendations data
   */
  static processRecommendationsData(recommendations: any[]) {
    return recommendations.map((recommendation) => ({
      name: recommendation.recommenderName,
      date: recommendation.createdAt,
      text: recommendation.comment,
    }));
  }

  /**
   * Saves availability data to the database
   */
  static async saveAvailabilityData(
    availability: AvailabilityData,
    userId: string,
    hourlyRate: string
  ) {
    await db.insert(WorkerAvailabilityTable).values({
      userId,
      days: availability.days || [],
      frequency: (availability.frequency || "never") as
        | "never"
        | "weekly"
        | "biweekly"
        | "monthly",
      startDate: availability.startDate,
      startTimeStr: availability.startTime,
      endTimeStr: availability.endTime,
      startTime: createTimestamp(availability.startTime),
      endTime: createTimestamp(availability.endTime),
      ends: (availability.ends || "never") as
        | "never"
        | "on_date"
        | "after_occurrences",
      occurrences: availability.occurrences,
      endDate: availability.endDate || null,
      notes: `Onboarding availability - Hourly Rate: ${hourlyRate}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Saves job title as a skill
   */
  static async saveJobTitleAsSkill(
    jobTitle: string,
    workerProfileId: string,
    hourlyRate: string
  ) {
    await db.insert(SkillsTable).values({
      workerProfileId,
      name: jobTitle,
      experienceMonths: 0,
      experienceYears: 0,
      agreedRate: String(parseFloat(hourlyRate) || 0),
      skillVideoUrl: null,
      adminTags: null,
      ableGigs: null,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Saves equipment data with transaction
   */
  static async saveEquipmentData(
    equipment: EquipmentData[],
    workerProfileId: string
  ) {
    await db.transaction(async (tx) => {
      // Delete existing equipment
      await tx
        .delete(EquipmentTable)
        .where(eq(EquipmentTable.workerProfileId, workerProfileId));

      // Insert new equipment
      await tx.insert(EquipmentTable).values(
        equipment.map((item) => ({
          workerProfileId,
          name: item.name,
          description: item.description || null,
          isVerifiedByAdmin: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      );
    });
  }

  /**
   * Creates or updates worker profile
   */
  static async upsertWorkerProfile(userId: string, profileData?: any) {
    const existingProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, userId),
    });

    if (existingProfile && profileData) {
      await db
        .update(GigWorkerProfilesTable)
        .set({ ...profileData, updatedAt: new Date() })
        .where(eq(GigWorkerProfilesTable.userId, userId));
      return existingProfile.id;
    } else if (!existingProfile) {
      const [newProfile] = await db
        .insert(GigWorkerProfilesTable)
        .values({
          userId,
          ...profileData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return newProfile.id;
    }

    return existingProfile.id;
  }

  /**
   * Updates user to gig worker status
   */
  static async markUserAsGigWorker(userId: string) {
    await db
      .update(UsersTable)
      .set({
        isGigWorker: true,
        lastRoleUsed: "GIG_WORKER",
        updatedAt: new Date(),
      })
      .where(eq(UsersTable.id, userId));
  }
}
