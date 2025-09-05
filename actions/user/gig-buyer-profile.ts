"use server";

import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  BuyerProfilesTable,
  GigsTable,
  PaymentsTable,
  ReviewsTable,
  UserBadgesLinkTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { and, eq, gt } from "drizzle-orm";

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

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(ReviewsTable.targetUserId, buyerProfile?.userId || ""),
    });

    // Get completed hires
    const completedHires = await db.query.GigsTable.findMany({
      where: and(
        eq(GigsTable.buyerUserId, user.id || ""),
        eq(GigsTable.statusInternal, "COMPLETED")
      ),
      with: { skillsRequired: { columns: { skillName: true } } },
    });

    // Count gigs per skill name and return array with name and value
    const skillCountsArr: { name: string; value: number }[] = [];
    const skillCounts: Record<string, number> = {};
    completedHires.forEach((gig) => {
      gig.skillsRequired.forEach((skill) => {
        skillCounts[skill.skillName] = (skillCounts[skill.skillName] || 0) + 1;
      });
    });
    for (const [name, value] of Object.entries(skillCounts)) {
      skillCountsArr.push({ name, value });
    }

    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Get last 12 months completed payments
    const payments = await db.query.PaymentsTable.findMany({
      where: and(
        eq(PaymentsTable.payerUserId, user.id || ""),
        eq(PaymentsTable.status, "COMPLETED"),
        gt(PaymentsTable.createdAt, twelveMonthsAgo)
      ),
      columns: {
        amountGross: true,
        createdAt: true,
      },
    });

    // Group payments into 4 groups of 3 months each
    const now = new Date();
    const groups: { amountGross: string; createdAt: Date }[][] = [
      [],
      [],
      [],
      [],
    ];

    payments.forEach((payment) => {
      const diffMonths =
        (now.getFullYear() - payment.createdAt.getFullYear()) * 12 +
        (now.getMonth() - payment.createdAt.getMonth());
      const groupIndex = Math.floor(diffMonths / 3);
      if (groupIndex >= 0 && groupIndex < 4) {
        groups[groupIndex].push(payment);
      }
    });

    // Calculate total expenses for each quarter, with clear naming
    const barData = groups.map((group, idx) => {
      const groupDate = new Date(
        now.getFullYear(),
        now.getMonth() - idx * 3,
        1
      );
      const quarter = Math.floor(groupDate.getMonth() / 3) + 1;
      const year = groupDate.getFullYear().toString().slice(-2);
      return {
        name: `Q${quarter}'${year}`,
        a: group.reduce((sum, payment) => sum + Number(payment.amountGross), 0),
      };
    });

    // Get badges
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

    const badgeDetails = badges?.map((badge) => ({
      id: badge.id,
      name: badge.badge.name,
      description: badge.badge.description,
      icon: badge.badge.icon,
      type: badge.badge.type,
      awardedAt: badge.awardedAt,
      awardedBySystem: badge.awardedBySystem,
    }));

    const reviewsData = await Promise.all(
      reviews.map(async (review) => {
        const author = review.authorUserId
          ? await db.query.UsersTable.findFirst({
              where: eq(UsersTable.id, review.authorUserId),
            })
          : null;

        return {
          id: review.id,
          name: review.recommenderName || author?.fullName,
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
      badges: badgeDetails,
      averageRating,
      completedHires: completedHires?.length || 0,
      skills:
        completedHires?.flatMap((gig) =>
          gig.skillsRequired.map((skill) => skill.skillName)
        ) || [],
      skillCounts: skillCountsArr,
      totalPayments: barData.reverse(),
    };

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
