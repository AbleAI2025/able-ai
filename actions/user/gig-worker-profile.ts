import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { eq } from "drizzle-orm";

export const getGigWorkerProfile = async (token: string) => {
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

    const badge = await db.query.BadgeDefinitionsTable.findMany({
      where: eq(UsersTable.id, uid),
    });

    const skill = await db.query.SkillsTable.findMany({
      where: eq(UsersTable.id, uid),
    });

    const gigWorkerProfile = await db.query.GigWorkerProfilesTable.findMany({
      where: eq(UsersTable.id, uid),
    });

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(UsersTable.id, uid),
    });

    const data = {
      badge,
      skill,
      gigWorkerProfile,
      reviews,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching buyer profile:", error);
    throw error;
  }
};

/*
BadgeDefinitionsTable
[2:14 PM]
SkillsTable
[2:15 PM]
responseRateInternal
[2:15 PM]
averageRating
Yoel.dev — 2:15 PM
GigWorkerProfilesTable
[2:17 PM]
ReviewsTable
*/
