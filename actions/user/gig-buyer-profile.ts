"use server";

import { db } from "@/lib/drizzle/db";
import {
    BuyerProfilesTable,
    UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const getGigBuyerProfile = async (
  token: string | undefined
): Promise<{ success: true, profile: any }> => {
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
    
      const buyerProfile = await db.query.BuyerProfilesTable.findFirst({
        where: eq(BuyerProfilesTable.id, user.id),
      });

    if (!buyerProfile) throw "Getting worker profile error";

    return { success: true, profile: buyerProfile };
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    throw error;
  }
};