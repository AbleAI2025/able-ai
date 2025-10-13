"use server";

import { db } from "@/lib/drizzle/db";
import { BuyerProfilesTable, UsersTable } from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const updateVideoUrlBuyerProfileAction = async (
  videoUrl: string,
  token?: string | undefined
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw new Error("User not found");

    await db
      .update(BuyerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(BuyerProfilesTable.userId, user.id));

    return { success: true, data: "Url video updated successfully" };
  } catch (error: unknown) {
    console.error("Error saving video url", error);
    return {
      success: false,
      data: "Failed to update video url",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const updateSocialLinkBuyerProfileAction = async (
  socialLink: string,
  token?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!token) {
      return { success: false, error: "User token is required" };
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) return { success: false, error: "Unauthorized" };

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });
    if (!user) return { success: false, error: "User not found" };

    await db
      .update(BuyerProfilesTable)
      .set({
        socialLink,
        updatedAt: new Date(),
      })
      .where(eq(BuyerProfilesTable.userId, user.id));

    return { success: true };
  } catch (error) {
    console.error("Error saving social link", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

type BusinessInfo = {
  fullCompanyName: string;
  location: { formatted_address: string; lat?: number; lng?: number };
  companyRole: string;
};

export const updateBusinessInfoBuyerProfileAction = async (
  { fullCompanyName, location, companyRole }: BusinessInfo,
  token?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!token) {
      return { success: false, error: "User token is required" };
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) return { success: false, error: "Unauthorized" };

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });
    if (!user) return { success: false, error: "User not found" };

    await db
      .update(BuyerProfilesTable)
      .set({
        fullCompanyName,
        billingAddressJson: location,
        companyRole,
        updatedAt: new Date(),
      })
      .where(eq(BuyerProfilesTable.userId, user.id));

    return { success: true };
  } catch (error) {
    console.error("Error saving business info", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
