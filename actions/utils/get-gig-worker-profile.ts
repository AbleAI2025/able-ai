import { ERROR_CODES } from "@/lib/responses/errors";
import { isUserAuthenticated } from "@/lib/user.server";
import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";

/**
 * Validates if a user is authenticated and returns user data
 */
export const validateUserAuthentication = async (token: string) => {
  if (!token) {
    throw new Error("Token is required");
  }

  const { uid } = await isUserAuthenticated(token);
  if (!uid) {
    throw ERROR_CODES.UNAUTHORIZED;
  }

  const user = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.firebaseUid, uid),
  });

  if (!user) {
    throw new Error("User not found");
  }

  return { user, uid };
};

/**
 * Validates hourly rate against minimum requirements
 */
export const validateHourlyRate = (rate: number | string): number => {
  const hourlyRate = parseFloat(String(rate));
  if (hourlyRate < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE) {
    throw new Error(
      `Hourly rate must be at least £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}`
    );
  }
  return hourlyRate;
};

/**
 * Creates timestamp from time string (HH:MM format)
 */
export const createTimestamp = (timeStr: string): Date => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

/**
 * Calculates average rating from reviews
 */
export const calculateAverageRating = (reviews: any[]): number => {
  if (!reviews?.length) return 0;
  const positiveReviews = reviews.filter((item) => item.rating === 1).length;
  return (positiveReviews / reviews.length) * 100;
};

/**
 * Standardized error handler for all actions
 */
export const handleActionError = (error: unknown): { success: false; data: null; error: string } => {
  return {
    success: false,
    data: null,
    error: error instanceof Error ? error.message : "Unknown error",
  };
};