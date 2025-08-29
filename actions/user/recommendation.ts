"use server";

import { db } from "@/lib/drizzle/db";
import { GigWorkerProfilesTable, ReviewsTable } from "@/lib/drizzle/schema";
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
      with: {
        user: {
          columns: {
            fullName: true,
          },
        },
        skills: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!workerProfile) {
      throw new Error("Worker profile not found");
    }

    if (!workerProfile.user) {
      throw new Error("User not found");
    }

    const workerData: WorkerForRecommendation = {
      userName: workerProfile.user.fullName,
      skills: workerProfile.skills,
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
  skillId: string;
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
      skillId,
    } = payload;

    if (
      !workerId ||
      !recommendationText.trim() ||
      !relationship.trim() ||
      !recommenderName.trim() ||
      !recommenderEmail.trim() ||
      !skillId.trim()
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

    await db.insert(ReviewsTable).values({
      targetUserId: targetUserId,
      comment: recommendationText.trim(),
      relationship: relationship.trim(),
      recommenderName: recommenderName.trim(),
      recommenderEmail: recommenderEmail.trim(),
      type: "EXTERNAL_REQUESTED",
      rating: 5,
      moderationStatus: "PENDING",
      isPublic: true,
      skillId: skillId,
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
