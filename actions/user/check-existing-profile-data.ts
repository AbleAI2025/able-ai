import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema/users";
import { eq } from "drizzle-orm";
import { isUserAuthenticated } from "@/lib/user.server";

export interface ExistingProfileData {
  hasLocation: boolean;
  hasAvailability: boolean;
  profileData: {
    fullName?: string;
    location?: string;
    availabilityJson?: any;
  };
}

export async function checkExistingProfileData(token: string): Promise<{
  success: boolean;
  data?: ExistingProfileData;
  error?: string;
}> {
  try {
    const { uid } = await isUserAuthenticated(token);
    if (!uid) {
      return { success: false, error: "User not authenticated" };
    }

    // Get user with their gig worker profile
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
      with: {
        gigWorkerProfile: {
          with: {
            skills: true
          }
        }
      }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const profile = user.gigWorkerProfile;
    const profileData = {
      fullName: user.fullName,
      location: profile?.location || undefined,
      availabilityJson: profile?.availabilityJson
    };

    const existingData: ExistingProfileData = {
      hasLocation: !!(profile?.location && profile.location.trim().length > 0),
      hasAvailability: !!(profile?.availabilityJson && 
        Array.isArray(profile.availabilityJson) && 
        profile.availabilityJson.length > 0),
      profileData
    };

    return { success: true, data: existingData };
  } catch (error) {
    console.error("Error checking existing profile data:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}
