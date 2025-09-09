import PublicWorkerProfile, { SemanticProfile } from "@/app/types/workerProfileTypes";
import { calculateAverageRating } from "../utils/get-gig-worker-profile";
import { GigWorkerProfileService } from "../services/get-gig-worker-profile";
import type { ActionResult, OnboardingProfileData } from "../types/get-gig-worker-profile";
import { GigWorkerProfilesTable } from "@/lib/drizzle/schema";
import type { Award } from "@/app/types/workerProfileTypes";
import type { BadgeIcon } from "@/app/components/profile/GetBadgeIcon";

export class ProfileDataHandler {
  /**
   * Builds complete worker profile data
   */
  static async buildWorkerProfile(
    workerProfile: typeof GigWorkerProfilesTable.$inferSelect | undefined,
  ): Promise<ActionResult<PublicWorkerProfile>> {
    try {
      if (!workerProfile) {
        throw new Error("Worker profile not found");
      }

      const profileData = await GigWorkerProfileService.fetchWorkerProfileData(workerProfile);
      const averageRating = calculateAverageRating(profileData.reviews);

      const { awards: _rawAwards, ...profileDataRest } = profileData;

      const awards: Award[] = (_rawAwards || []).map((award: any) => ({
        id: award.id,
        type: award.type ?? "OTHER",
        name: award.name ?? "Unknown Award",
        icon: (getBadgeIcon(award.badgeId) as BadgeIcon) ?? "/icons/badges/default.svg" as BadgeIcon,
        description: award.notes ?? null,
        awardedAt: award.awardedAt,
        awardedBySystem: award.awardedBySystem ?? null,
      }));

      const data: PublicWorkerProfile = {
        ...workerProfile,
        fullBio: workerProfile?.fullBio ?? undefined,
        location: workerProfile?.location ?? undefined,
        privateNotes: workerProfile?.privateNotes ?? undefined,
        responseRateInternal: workerProfile?.responseRateInternal ?? undefined,
        videoUrl: workerProfile?.videoUrl ?? undefined,
        availabilityJson: undefined,
        semanticProfileJson: workerProfile?.semanticProfileJson as SemanticProfile,
        averageRating,
        awards, // <-- mapped awards
        ...profileDataRest, // <-- rest of profileData, awards excluded
      };

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Prepares profile data for database operations
   */
  static prepareProfileUpdateData(profileData: OnboardingProfileData) {
    return {
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
    };
  }
}

function getBadgeIcon(badgeId: any): BadgeIcon | null {
  if (!badgeId) return null;

  const badgeIcons: Record<string, BadgeIcon> = {
    "star": "goldenVibes",
    "medal": "fairPlay",
    "trophy": "heartMode",
    // etc: aquí mapeas IDs a tus BadgeIcon strings válidos
  };

  return badgeIcons[String(badgeId)] ?? null;
}
