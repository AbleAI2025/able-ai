import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/drizzle/db";
import {
  BadgeDefinitionsTable,
  GigWorkerProfilesTable,
  ReviewsTable,
  UserBadgesLinkTable,
  UsersTable,
} from "@/lib/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { isUserAuthenticated } from "@/lib/user.server";
import { SemanticProfile } from "@/app/types/workerProfileTypes";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const { uid } = await isUserAuthenticated(token);
    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, uid),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
      with: {
        user: { columns: { fullName: true, rtwStatus: true } },
        skills: true,
        qualifications: true,
        equipment: true,
      },
    });

    if (!workerProfile) {
      return NextResponse.json(
        { error: "Worker profile not found" },
        { status: 404 }
      );
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
      .where(eq(UserBadgesLinkTable.userId, workerProfile.userId));

    const badgeDetails = badges?.map((badge) => ({
      id: badge.id,
      name: badge.badge.name,
      description: badge.badge.description,
      icon: badge.badge.icon ?? "",
      type: badge.badge.type,
      awardedAt: badge.awardedAt,
      awardedBySystem: badge.awardedBySystem,
    }));

    const reviews = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "INTERNAL_PLATFORM")
      ),
    });

    const recommendations = await db.query.ReviewsTable.findMany({
      where: and(
        eq(ReviewsTable.targetUserId, workerProfile.userId),
        eq(ReviewsTable.type, "EXTERNAL_REQUESTED")
      ),
    });

    const totalReviews = reviews?.length;
    const positiveReviews = reviews?.filter((item) => item.rating === 1).length;
    const averageRating =
      totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0;

    const data = {
      ...workerProfile,
      fullBio: workerProfile?.fullBio,
      location: workerProfile?.location,
      privateNotes: workerProfile?.privateNotes,
      responseRateInternal: workerProfile?.responseRateInternal,
      videoUrl: workerProfile?.videoUrl,
      hashtags: Array.isArray(workerProfile?.hashtags)
        ? workerProfile.hashtags
        : undefined,
      availabilityJson: undefined, // Set to undefined since we now use worker_availability table
      semanticProfileJson:
        workerProfile?.semanticProfileJson as SemanticProfile,
      averageRating,
      awards: badgeDetails,
      equipment: workerProfile?.equipment,
      skills: workerProfile?.skills,
      reviews,
      recommendations,
      qualifications: workerProfile?.qualifications,
      user: { fullName: workerProfile?.user?.fullName || "" },
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching private worker profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
