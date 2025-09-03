
import PublicWorkerProfile, { SemanticProfile } from "@/app/types/workerProfileTypes";
import { calculateAverageRating } from "../utils/get-gig-worker-profile";
import { GigWorkerProfileService } from "../services/get-gig-worker-profile";
import type { ActionResult, OnboardingProfileData } from "../types/get-gig-worker-profile";

export class ProfileDataHandler {
  /**
   * Builds complete worker profile data
   */
  static async buildWorkerProfile(
    workerProfile: any
  ): Promise<ActionResult<PublicWorkerProfile>> {
    try {
      if (!workerProfile) {
        throw new Error("Worker profile not found");
      }

      const profileData = await GigWorkerProfileService.fetchWorkerProfileData(workerProfile);
      const averageRating = calculateAverageRating(profileData.reviews);

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
        ...profileData,
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