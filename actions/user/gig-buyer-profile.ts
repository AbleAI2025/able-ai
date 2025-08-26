"use server";

import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  BuyerProfilesTable,
  ReviewsTable,
  UserBadgesLinkTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

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

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(ReviewsTable.targetUserId, buyerProfile?.userId || ""),
    });

    if (!buyerProfile) {
      throw new Error("Buyer profile not found");
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
      .where(eq(UserBadgesLinkTable.userId, buyerProfile?.userId || ""));

    const reviewsData = await Promise.all(
      reviews.map(async (review) => {
        const author = review.authorUserId ? await db.query.UsersTable.findFirst({
          where: eq(UsersTable.id, review.authorUserId),
        }) : null;

        return {
          id: review.id,
          name: author?.fullName || "Unknown",
          date: review.createdAt,
          text: review.comment,
        };
      })
    );

        const totalReviews = reviews?.length;

    const positiveReviews = reviews?.filter((item) => item.rating === 1).length;

    const averageRating =
      totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

    const data = {
      ...user,
      ...buyerProfile,
      reviews: reviewsData,
      badges: badges,
      averageRating
    };

    console.log(data);

    return { success: true, profile: data };
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    return { success: false, profile: null };
  }
};

export const updateVideoUrlBuyerProfileAction = async (
  videoUrl: string,
  token?: string | undefined
) => {
  try {
    if (!token) {
      throw new Error("User ID is required to fetch buyer profile");
    }

    const { uid } = await isUserAuthenticated(token);
    if (!uid) throw ERROR_CODES.UNAUTHORIZED;

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) throw "User not found";

    await db
      .update(BuyerProfilesTable)
      .set({
        videoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(BuyerProfilesTable.userId, user?.id));

    return { success: true, data: "Url video updated successfully" };
  } catch (error) {
    console.log("Error saving video url", error);
    return { success: false, data: "Url video updated successfully", error };
  }
};
