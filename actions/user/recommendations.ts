"use server";

import { db } from "@/lib/drizzle/db";
import { RecommendationsTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";

interface RecommendationSubmissionData {
  workerId: string;
  recommendationText: string;
  relationship: string;
  recommenderName: string;
  recommenderEmail: string;
}

export const submitRecommendationAction = async (data: RecommendationSubmissionData) => {
  try {
    // Generate a unique recommendation code (using worker ID as base)
    const recommendationCode = `${data.workerId.substring(0, 8)}-${Date.now().toString(36)}`;

    // Insert the recommendation into the database
    const result = await db.insert(RecommendationsTable).values({
      workerUserId: data.workerId,
      recommendationCode,
      recommendationText: data.recommendationText,
      relationship: data.relationship,
      recommenderName: data.recommenderName,
      recommenderEmail: data.recommenderEmail,
      isVerified: false,
      moderationStatus: "PENDING",
    }).returning();

    return {
      success: true,
      data: "Recommendation submitted successfully",
      recommendationId: result[0].id,
    };
  } catch (error) {
    console.error('Error submitting recommendation:', error);
    return {
      success: false,
      error: 'Failed to submit recommendation',
    };
  }
};

export const getRecommendationsByWorkerIdAction = async (workerId: string) => {
  try {
    const recommendations = await db.query.RecommendationsTable.findMany({
      where: eq(RecommendationsTable.workerUserId, workerId),
      orderBy: (recommendations, { desc }) => [desc(recommendations.createdAt)],
    });

    return {
      success: true,
      data: recommendations,
    };
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return {
      success: false,
      error: 'Failed to fetch recommendations',
    };
  }
};

export const getWorkerDetailsByRecommendationCodeAction = async (recommendationCode: string) => {
  try {
    const recommendation = await db.query.RecommendationsTable.findFirst({
      where: eq(RecommendationsTable.recommendationCode, recommendationCode),
      columns: {
        workerUserId: true,
      }
    });

    if (!recommendation) {
      return {
        success: false,
        error: "Recommendation not found"
      };
    }

    // Get worker details using the worker ID
    const { getWorkerDetailsAction } = await import('./get-worker-details');
    return await getWorkerDetailsAction(recommendation.workerUserId);

  } catch (error) {
    console.error('Error fetching worker details by recommendation code:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
};
