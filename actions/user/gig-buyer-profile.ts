"use server";

import { db } from "@/lib/drizzle/db";
import { BuyerProfilesTable, UsersTable } from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";
import {
  getCompletedHiresData,
  getPaymentsData,
  getBadgesData,
  getReviewsData,
} from "./buyer-profile-data";

export const getGigBuyerProfileAction = async (
  token: string | undefined
): Promise<{ success: boolean; profile: any }> => {
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
      where: eq(BuyerProfilesTable.userId, user.id),
    });

    if (!buyerProfile) {
      throw new Error("Buyer profile not found");
    }

    const [reviewsDataResult, completedHiresData, paymentsData, badgesData] =
      await Promise.all([
        getReviewsData(buyerProfile.userId),
        getCompletedHiresData(user.id),
        getPaymentsData(user.id),
        getBadgesData(buyerProfile.userId),
      ]);

    const data = {
      ...user,
      ...buyerProfile,
      reviews: reviewsDataResult.reviews,
      badges: badgesData,
      averageRating: reviewsDataResult.averageRating,
      completedHires: completedHiresData.completedHires.length,
      skills: completedHiresData.skillCountsArr,
      skillCounts: completedHiresData.skillCounts,
      totalPayments: paymentsData,
      topSkills: completedHiresData.topSkills,
    };

    return { success: true, profile: data };
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    return { success: false, profile: null };
  }
};

