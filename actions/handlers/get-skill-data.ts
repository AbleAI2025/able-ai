import { db } from "@/lib/drizzle/db";
import {
  GigWorkerProfilesTable,
  QualificationsTable,
  SkillsTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { GigWorkerProfileService } from "../services/get-gig-worker-profile";
import type {
  ActionResult,
  SkillProfile,
} from "../types/get-gig-worker-profile";

export class SkillDataHandler {
  /**
   * Builds complete skill profile data
   */
  static async buildSkillProfile(
    skill:  typeof SkillsTable.$inferSelect,
  ): Promise<ActionResult<SkillProfile>> {
    try {
      const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
        where: eq(GigWorkerProfilesTable.id, skill.workerProfileId),
      });

      const user = await db.query.UsersTable.findFirst({
        where: eq(UsersTable.id, workerProfile?.userId || ""),
      });

      const [badges, qualifications, reviews, recommendations] =
        await Promise.all([
          GigWorkerProfileService.fetchBadgesWithDefinitions(
            workerProfile?.userId || ""
          ),
          db.query.QualificationsTable.findMany({
            where: eq(
              QualificationsTable.workerProfileId,
              workerProfile?.id || ""
            ),
          }),
          GigWorkerProfileService.fetchInternalReviews(
            workerProfile?.userId || ""
          ),
          GigWorkerProfileService.fetchExternalRecommendations(
            workerProfile?.userId || "",
            skill.id
          ),
        ]);

      const [reviewsData, recommendationsData] = await Promise.all([
        GigWorkerProfileService.processReviewsData(reviews),
        Promise.resolve(
          GigWorkerProfileService.processRecommendationsData(recommendations)
        ),
      ]);

      const skillProfile: SkillProfile = {
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
        latitude: workerProfile?.latitude != null
          ? Number(workerProfile.latitude)
          : null,
        longitude: workerProfile?.longitude != null
          ? Number(workerProfile.longitude)
          : null,
        videoUrl: workerProfile?.videoUrl || "",
        statistics: {
          reviews: reviews?.length,
          paymentsCollected: 0,
          tipsReceived: 0,
        },
        supportingImages: skill.images ?? [],
        badges,
        qualifications,
        buyerReviews: reviewsData,
        recommendations: recommendationsData,
      };

      return { success: true, data: skillProfile };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
