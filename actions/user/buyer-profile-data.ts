"use server";

import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  GigsTable,
  PaymentsTable,
  ReviewsTable,
  UserBadgesLinkTable
} from "@/lib/drizzle/schema";
import { and, eq, gt } from "drizzle-orm";

export const getCompletedHiresData = async (userId: string) => {
  // Get completed hires
  const completedHires = await db.query.GigsTable.findMany({
    where: and(
      eq(GigsTable.buyerUserId, userId),
      eq(GigsTable.statusInternal, "COMPLETED")
    ),
    with: { skillsRequired: { columns: { skillName: true } } },
  });

  // Count gigs per skill name and return array with name and value
  const skillCounts: Record<string, number> = {};
  completedHires.forEach((gig) => {
    gig.skillsRequired.forEach((skill) => {
      skillCounts[skill.skillName] = (skillCounts[skill.skillName] || 0) + 1;
    });
  });
  const skillCountsArr = Object.entries(skillCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const topSkills = skillCountsArr
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  return { completedHires, skillCountsArr, skillCounts, topSkills };
};

export const getPaymentsData = async (userId: string) => {
  // Calculate date 12 months ago
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  // Get last 12 months completed payments
  const payments = await db.query.PaymentsTable.findMany({
    where: and(
      eq(PaymentsTable.payerUserId, userId),
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
  const groups: { amountGross: string; createdAt: Date }[][] = [[], [], [], []];

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
    const groupDate = new Date(now.getFullYear(), now.getMonth() - idx * 3, 1);
    const quarter = Math.floor(groupDate.getMonth() / 3) + 1;
    const year = groupDate.getFullYear().toString().slice(-2);
    return {
      name: `Q${quarter}'${year}`,
      amount: group.reduce((sum, payment) => sum + Number(payment.amountGross), 0),
    };
  });

  return barData.reverse();
};

export const getBadgesData = async (userId: string) => {
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
    .where(eq(UserBadgesLinkTable.userId, userId));

  const badgeDetails = badges.map((badge) => ({
    id: badge.id,
    name: badge.badge.name,
    description: badge.badge.description,
    icon: badge.badge.icon,
    type: badge.badge.type,
    awardedAt: badge.awardedAt,
    awardedBySystem: badge.awardedBySystem,
  }));

  return badgeDetails;
};

export const getReviewsData = async (userId: string) => {
  const reviews = await db.query.ReviewsTable.findMany({
    where: eq(ReviewsTable.targetUserId, userId),
  });

  const authorIds = reviews
    .map((review) => review.authorUserId)
    .filter((id): id is string => !!id);

  const authors = authorIds.length > 0
    ? await db.query.UsersTable.findMany({
        where: (users, { inArray }) => inArray(users.id, authorIds),
      })
    : [];

  const authorsById = new Map(authors.map((author) => [author.id, author]));

  const reviewsData = reviews.map((review) => {
    const author = review.authorUserId
      ? authorsById.get(review.authorUserId)
      : null;
    return {
      id: review.id,
      name: review.recommenderName || author?.fullName,
      date: review.createdAt,
      text: review.comment,
    };
  });

  const totalReviews = reviews.length;

  const positiveReviews = reviews.filter((item) => item.rating === 1).length;

  const averageRating =
    totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

  return { reviews: reviewsData, averageRating };
};