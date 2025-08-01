"use server";

import { db } from "@/lib/drizzle/db";
import { EquipmentTable, GigWorkerProfilesTable, QualificationsTable, ReviewsTable, SkillsTable, UsersTable } from "@/lib/drizzle/schema";
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

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.userId, user.id),
    });

    let skills;
    let equipment;
    let qualifications;

    if (workerProfile) {
      skills = await db.query.SkillsTable.findMany({
        where: eq(SkillsTable.workerProfileId, workerProfile.id),
      });
  
      equipment = await db.query.EquipmentTable.findMany({
        where: eq(EquipmentTable.workerProfileId, workerProfile.id),
      });
  
      qualifications = await db.query.QualificationsTable.findMany({
        where: eq(QualificationsTable.workerProfileId, workerProfile.id),
      });
    }

    const awards = await db.query.BadgeDefinitionsTable.findMany();

    const reviews = await db.query.ReviewsTable.findMany({
      where: eq(ReviewsTable.targetUserId, user.id),
    });

    const data = {
      ...workerProfile,
      awards,
      equipment,
      skills,
      reviews,
      qualifications
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
