'use server';

import { db } from "@/lib/drizzle/db";
import { UsersTable } from "@/lib/drizzle/schema";
import { eq } from 'drizzle-orm';
import { stripeApi } from '@/lib/stripe-server';
import { getErrorMessage } from '@/lib/utils/errors';
import { logServer, ERROR_CODES } from '@/lib/log';
import { 
  startPerformanceTracking, 
  endPerformanceTracking, 
  logPerformanceSummary 
} from '@/lib/utils/performance-monitor';
import {
  handleStripeCustomerRetrieval,
  handleStripeAccountRetrieval,
  getGracefulDefaults,
  retryStripeOperation,
} from '@/lib/stripe/error-handler';
import { DetailedStripeStatus } from './types';
import { WorkerUser } from "@/actions/user/get-worker-user";

// Global counter for performance logging sampling
let performanceLogCounter = 0;

/**
 * Check buyer status by retrieving and analyzing Stripe customer information
 */
async function checkBuyerStatus(
  firebaseUid: string,
  customerId: string,
  status: DetailedStripeStatus
): Promise<void> {
  const customerResult = await handleStripeCustomerRetrieval(
    stripeApi,
    customerId,
    {
      operation: 'buyer_status_check',
      userId: firebaseUid,
      stripeId: customerId,
    }
  );

  if (customerResult.success) {
    // Customer can pay if they exist and are not delinquent
    status.canPay = !customerResult.data.delinquent;

    logServer({
      code: 20003,
      message: 'Buyer status checked successfully',
      type: 'info',
      details: {
        firebaseUid,
        customerId: customerId,
        canPay: status.canPay,
        delinquent: customerResult.data.delinquent,
      },
    });
  } else {
    // Safe default: assume cannot pay if we can't verify
    status.canPay = false;

    logServer({
      ...ERROR_CODES.STRIPE_CUSTOMER_RETRIEVAL_FAILED,
      details: {
        firebaseUid,
        customerId: customerId,
        fallbackValue: status.canPay,
      },
    });
  }
}

/**
 * Update worker capabilities in the database
 */
async function updateWorkerCapabilitiesInDatabase(
  firebaseUid: string,
  userId: string,
  payoutsEnabled: boolean,
  transfersActive: boolean,
  canEarn: boolean
): Promise<boolean> {
  const updateResult = await retryStripeOperation(
    async () => {
      await db.update(UsersTable)
        .set({
          canReceivePayouts: payoutsEnabled,
          stripeAccountStatus: transfersActive && payoutsEnabled ? 'connected' : 'incomplete',
        })
        .where(eq(UsersTable.id, userId));
      return true;
    },
    {
      operation: 'database_update',
      userId: firebaseUid,
      additionalContext: {
        payoutsEnabled,
        transfersActive,
        canEarn,
      },
    },
    2, // Max 2 retries for database operations
    500 // 500ms base delay
  );

  if (!updateResult.success) {
    logServer({
      ...ERROR_CODES.STRIPE_STATUS_UPDATE_FAILED,
      details: {
        firebaseUid,
        accountId: userId,
        error: updateResult.error,
      },
    });
  }

  return updateResult.success;
}

/**
 * Check worker status by retrieving and analyzing Stripe Connect account information
 */
async function checkWorkerStatus(
  firebaseUid: string,
  accountId: string,
  userRecord: WorkerUser,
  status: DetailedStripeStatus
): Promise<void> {
  const accountResult = await handleStripeAccountRetrieval(
    stripeApi,
    accountId,
    {
      operation: 'worker_status_check',
      userId: firebaseUid,
      stripeId: accountId,
    }
  );

  if (accountResult.success) {
    const transfersActive = accountResult.data.capabilities?.transfers === 'active';
    const payoutsEnabled = accountResult.data.payouts_enabled;

    // Worker can earn if they have active transfers and payouts enabled
    status.canEarn = transfersActive && payoutsEnabled;

    // Update database with current capability information
    const dbUpdated = await updateWorkerCapabilitiesInDatabase(
      firebaseUid,
      userRecord.id,
      payoutsEnabled,
      transfersActive,
      status.canEarn
    );

    logServer({
      code: 20004,
      message: 'Worker status checked successfully',
      type: 'info',
      details: {
        firebaseUid,
        accountId: accountId,
        canEarn: status.canEarn,
        transfersActive,
        payoutsEnabled,
        databaseUpdated: dbUpdated,
      },
    });
  } else {
    // Maintain existing canReceivePayouts value as fallback
    status.canEarn = userRecord.canReceivePayouts || false;

    logServer({
      ...ERROR_CODES.STRIPE_ACCOUNT_RETRIEVAL_FAILED,
      details: {
        firebaseUid,
        accountId: accountId,
        fallbackValue: status.canEarn,
      },
    });
  }
}

/**
 * Enhanced Stripe status checking that provides detailed capability information
 * Returns four boolean fields indicating connection status and functional capabilities
 * @param firebaseUid - The Firebase UID of the user
 * @param userRole - The user's role (for future use and API consistency)
 */
export async function getDetailedStripeStatus(
  firebaseUid: string,
  userRole: "BUYER" | "GIG_WORKER"
): Promise<DetailedStripeStatus> {
  const operationName = 'getDetailedStripeStatus';
  const startTime = startPerformanceTracking();
  
  // Safe defaults for error scenarios
  const safeDefaults: DetailedStripeStatus = {
    buyerConnected: false,
    canPay: false,
    workerConnected: false,
    canEarn: false,
  };

  try {
    // Log operation start
    logServer({
      code: 20000,
      message: `Starting detailed Stripe status check for ${userRole} user`,
      type: 'info',
      details: {
        firebaseUid,
        userRole,
        operation: operationName,
      },
    });
    
    // Fetch user record with Stripe fields
    const userRecord = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.firebaseUid, firebaseUid),
      columns: {
        id: true,
        stripeCustomerId: true,
        stripeConnectAccountId: true,
        canReceivePayouts: true,
        stripeAccountStatus: true,
      }
    });

    if (!userRecord) {
      logServer({
        ...ERROR_CODES.FETCH_DATA_FAILED,
        message: 'User not found for Stripe status check',
        details: {
          firebaseUid,
          operation: operationName,
        },
      });
      
      endPerformanceTracking(operationName, startTime, false, 'User not found');
      return safeDefaults;
    }

    const status: DetailedStripeStatus = { ...safeDefaults };

    // Check buyer status
    if (userRecord.stripeCustomerId) {
      status.buyerConnected = true;
      await checkBuyerStatus(firebaseUid, userRecord.stripeCustomerId, status);
    }

    // Check worker status
    if (userRecord.stripeConnectAccountId) {
      status.workerConnected = true;
      await checkWorkerStatus(firebaseUid, userRecord.stripeConnectAccountId, userRecord, status);
    }

    // Log successful completion
    logServer({
      code: 20005,
      message: 'Detailed Stripe status check completed successfully',
      type: 'analytics',
      details: {
        firebaseUid,
        userRole,
        status,
        operation: operationName,
      },
    });

    endPerformanceTracking(operationName, startTime, true);
    
    // Log performance summary periodically (every 10th call)
    performanceLogCounter = (performanceLogCounter + 1) % 10;
    if (performanceLogCounter === 0) {
      logPerformanceSummary(operationName);
    }

    return status;

  } catch (error) {
    logServer({
      ...ERROR_CODES.UNKNOWN,
      message: 'Unexpected error in getDetailedStripeStatus',
      details: {
        firebaseUid,
        userRole,
        error: getErrorMessage(error),
        operation: operationName,
      },
    });

    endPerformanceTracking(operationName, startTime, false, error instanceof Error ? error : String(error));

    // Return graceful defaults with context
    return getGracefulDefaults({
      operation: operationName,
      userId: firebaseUid,
      userRole: userRole,
      errorType: 'unknown',
    });
  }
}