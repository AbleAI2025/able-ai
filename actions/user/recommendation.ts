"use server";

import { db } from "@/lib/drizzle/db";
import {
  GigWorkerProfilesTable,
  SkillsTable,
  UsersTable,
  ReviewsTable,
} from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

interface WorkerForRecommendation {
  userName: string;
  skills: Array<{
    id: string;
    name: string;
  }>;
}

export const getWorkerForRecommendationAction = async (
  workerId: string,
): Promise<{
  success: boolean;
  data: WorkerForRecommendation | null;
  error?: string;
}> => {
  try {
    if (!workerId) {
      throw new Error("Worker ID is required");
    }

    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerId),
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    // Get the user details for the worker
    const user = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, workerProfile.userId),
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get all skills for this worker
    const skills = await db.query.SkillsTable.findMany({
      where: eq(SkillsTable.workerProfileId, workerProfile.id),
    });

    // Format the skills data to return only id and name
    const formattedSkills = skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));

    const workerData: WorkerForRecommendation = {
      userName: user.fullName,
      skills: formattedSkills,
    };

    return {
      success: true,
      data: workerData,
    };
  } catch (error) {
    console.error("Error fetching worker for recommendation:", error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};

interface ExternalRecommendationPayload {
  workerId: string; 
  recommendationText: string;
  relationship: string;
  recommenderName: string;
  recommenderEmail: string;
}

export const submitExternalRecommendationAction = async (
  payload: ExternalRecommendationPayload,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const {
      workerId,
      recommendationText,
      relationship,
      recommenderName,
      recommenderEmail,
    } = payload;

    if (
      !workerId ||
      !recommendationText ||
      !relationship ||
      !recommenderName ||
      !recommenderEmail
    ) {
      throw new Error("All fields are required to submit a recommendation.");
    }

    // Find the target user's ID from the worker profile ID
    const workerProfile = await db.query.GigWorkerProfilesTable.findFirst({
      where: eq(GigWorkerProfilesTable.id, workerId),
      columns: {
        userId: true, // We only need the userId to link the review
      },
    });

    if (!workerProfile || !workerProfile.userId) {
      throw new Error(
        "Could not find the worker profile to add a recommendation to.",
      );
    }

    const targetUserId = workerProfile.userId;

    // Insert the new review into the database
    await db.insert(ReviewsTable).values({
      targetUserId: targetUserId,
      comment: recommendationText,
      relationship: relationship,
      recommenderName: recommenderName,
      recommenderEmail: recommenderEmail,
      type: "EXTERNAL_REQUESTED",
      rating: 5,
      moderationStatus: "PENDING",
      isPublic: true,
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error submitting external recommendation:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unknown error occurred while submitting the recommendation.",
    };
  }
};
