"use server";

import { createNotificationAction } from "./notifications";
import { isUserAuthenticated } from "@/lib/user.server";
import { ERROR_CODES } from "@/lib/responses/errors";
import { db } from "@/lib/drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable, GigWorkerProfilesTable } from "@/lib/drizzle/schema";
import { VALIDATION_CONSTANTS } from "@/app/constants/validation";

/**
 * Helper function to lookup worker profile by user ID
 */
async function getWorkerProfileByUserId(userId: string) {
  return await db.query.GigWorkerProfilesTable.findFirst({
    where: eq(GigWorkerProfilesTable.userId, userId),
    with: {
      user: true
    }
  });
}

export interface WorkerBookingNotificationData {
  workerId: string;
  workerName: string;
  buyerName: string;
  gigTitle: string;
  gigId: string;
  hourlyRate: number;
  totalHours: number;
  totalAmount: number;
  gigDate?: string;
  gigLocation?: string;
}

/**
 * Send notification to worker when they are booked for a gig
 */
export async function sendWorkerBookingNotificationAction(
  data: WorkerBookingNotificationData,
  token: string
) {
  try {
    // Authenticate the buyer making the booking
    const { data: buyerData } = await isUserAuthenticated(token);
    if (!buyerData) throw ERROR_CODES.UNAUTHORIZED;

    // Get worker's user ID - data.workerId is actually the user ID from matchmaking
    // Look up worker profile by user ID (since data.workerId is the user ID from matchmaking)
    const workerProfile = await getWorkerProfileByUserId(data.workerId);

    if (!workerProfile?.user) {
      console.error("Worker not found with ID:", data.workerId);
      return {
        success: false,
        error: "Worker not found",
        data: null,
      };
    }

    const workerUid = workerProfile.user.firebaseUid;
    if (!workerUid) {
      return {
        success: false,
        error: "Worker Firebase UID not found",
        data: null,
      };
    }

    // Create notification content
    const notificationTitle = "🎉 You've been booked!";
    const isPendingGig = data.gigId === VALIDATION_CONSTANTS.GIG_STATUS.PENDING || data.gigId === VALIDATION_CONSTANTS.GIG_STATUS.TEMP;
    const notificationBody = isPendingGig 
      ? `${data.buyerName} wants to book you for "${data.gigTitle}" - £${data.totalAmount.toFixed(2)} total. Check your dashboard for details!`
      : `${data.buyerName} has booked you for "${data.gigTitle}" - £${data.totalAmount.toFixed(2)} total`;
    
    // Determine notification path - go to worker dashboard for pending gigs, specific gig for confirmed ones
    // Use worker profile ID in the path (this is what the URL structure expects)
    const notificationPath = isPendingGig 
      ? `/user/${workerProfile.id}/worker` // Go to worker dashboard
      : `/user/${workerProfile.id}/worker/gigs/${data.gigId}`; // Go to specific gig
    
    // Create the notification
    const notificationResult = await createNotificationAction(
      {
        userUid: workerUid,
        type: VALIDATION_CONSTANTS.NOTIFICATION_TYPES.OFFER,
        title: notificationTitle,
        body: notificationBody,
        image: "/images/booking-notification.svg", // You can add a booking notification icon
        path: notificationPath, // Link to gigs list or specific gig
        status: "unread",
      },
      token
    );

    if (!notificationResult.success) {
      console.error("Failed to send booking notification:", notificationResult.error);
      return {
        success: false,
        error: "Failed to send notification to worker",
        data: null,
      };
    }

    
    return {
      success: true,
      data: {
        message: "Booking notification sent successfully",
        notificationId: notificationResult.data,
        workerUid,
      },
    };
  } catch (error) {
    console.error("Error sending worker booking notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

/**
 * Send notification to worker when their booking is confirmed
 */
export async function sendWorkerBookingConfirmationNotificationAction(
  data: WorkerBookingNotificationData,
  token: string
) {
  try {
    const { data: buyerData } = await isUserAuthenticated(token);
    if (!buyerData) throw ERROR_CODES.UNAUTHORIZED;

    // Get worker's user ID - data.workerId is actually the user ID from matchmaking
    const workerProfile = await getWorkerProfileByUserId(data.workerId);

    if (!workerProfile?.user?.firebaseUid) {
      console.error("Worker not found with ID:", data.workerId);
      return {
        success: false,
        error: "Worker not found",
        data: null,
      };
    }

    const notificationTitle = "✅ Booking Confirmed!";
    const notificationBody = `Your booking for "${data.gigTitle}" has been confirmed. See you on ${data.gigDate || 'the scheduled date'}!`;

    const notificationResult = await createNotificationAction(
      {
        userUid: workerProfile.user.firebaseUid,
        type: VALIDATION_CONSTANTS.NOTIFICATION_TYPES.GIG_UPDATE,
        title: notificationTitle,
        body: notificationBody,
        image: "/images/confirmation-notification.svg",
        path: `/user/${workerProfile.id}/worker/gigs/${data.gigId}`,
        status: "unread",
      },
      token
    );

    return {
      success: notificationResult.success,
      data: notificationResult.data,
      error: notificationResult.error,
    };
  } catch (error) {
    console.error("Error sending booking confirmation notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

/**
 * Send notification to worker when their booking is cancelled
 */
export async function sendWorkerBookingCancellationNotificationAction(
  data: {
    workerId: string;
    workerName: string;
    buyerName: string;
    gigTitle: string;
    gigId: string;
    reason?: string;
  },
  token: string
) {
  try {
    const { data: buyerData } = await isUserAuthenticated(token);
    if (!buyerData) throw ERROR_CODES.UNAUTHORIZED;

    // Get worker's user ID - data.workerId is actually the user ID from matchmaking
    const workerProfile = await getWorkerProfileByUserId(data.workerId);

    if (!workerProfile?.user?.firebaseUid) {
      console.error("Worker not found with ID:", data.workerId);
      return {
        success: false,
        error: "Worker not found",
        data: null,
      };
    }

    const notificationTitle = "❌ Booking Cancelled";
    const notificationBody = `${data.buyerName} has cancelled your booking for "${data.gigTitle}"${data.reason ? `. Reason: ${data.reason}` : ''}`;

    const notificationResult = await createNotificationAction(
      {
        userUid: workerProfile.user.firebaseUid,
        type: VALIDATION_CONSTANTS.NOTIFICATION_TYPES.GIG_UPDATE,
        title: notificationTitle,
        body: notificationBody,
        image: "/images/cancellation-notification.svg",
        path: `/user/${workerProfile.id}/worker/gigs`,
        status: "unread",
      },
      token
    );

    return {
      success: notificationResult.success,
      data: notificationResult.data,
      error: notificationResult.error,
    };
  } catch (error) {
    console.error("Error sending booking cancellation notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}

/**
 * Test function to send a sample notification (for development/testing)
 */
export async function testWorkerBookingNotificationAction(
  workerId: string,
  token: string
) {
  try {
    const testData: WorkerBookingNotificationData = {
      workerId,
      workerName: "Test Worker",
      buyerName: "Test Buyer",
      gigTitle: "Test Gig - Bartending Event",
      gigId: "test-gig-123",
      hourlyRate: 25,
      totalHours: 6,
      totalAmount: 150,
      gigDate: "2024-01-15",
      gigLocation: "London, UK",
    };

    return await sendWorkerBookingNotificationAction(testData, token);
  } catch (error) {
    console.error("Error in test notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
}
