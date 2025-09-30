"use server";

import { checkExistingProfileData, ExistingProfileData } from "./check-existing-profile-data";

export async function checkExistingProfileDataAction(token: string): Promise<{
  success: boolean;
  data?: ExistingProfileData;
  error?: string;
}> {
  try {
    if (!token) {
      // If no token, return no existing data (user not logged in)
      return {
        success: true,
        data: {
          hasLocation: false,
          hasAvailability: false,
          hasSkills: false,
          hasFullBio: false,
          profileData: {}
        }
      };
    }
    
    return await checkExistingProfileData(token);
  } catch (error) {
    console.error("Error checking existing profile data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
