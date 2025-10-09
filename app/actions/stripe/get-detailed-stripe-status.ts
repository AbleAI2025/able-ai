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

    // Check buyer status (customer account and delinquent status)
    if (userRecord.stripeCustomerId) {
      status.buyerConnected = true;
      
      const customerResult = await handleStripeCustomerRetrieval(
        stripeApi,
        userRecord.stripeCustomerId,
        {
          operation: 'buyer_status_check',
          userId: firebaseUid,
          stripeId: userRecord.stripeCustomerId,
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
            customerId: userRecord.stripeCustomerId,
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
            customerId: userRecord.stripeCustomerId,
            fallbackValue: status.canPay,
          },
        });
      }
    }

    // Check worker status (Connect account and transfer capabilities)
    if (userRecord.stripeConnectAccountId) {
      status.workerConnected = true;
      
      const accountResult = await handleStripeAccountRetrieval(
        stripeApi,
        userRecord.stripeConnectAccountId,
        {
          operation: 'worker_status_check',
          userId: firebaseUid,
          stripeId: userRecord.stripeConnectAccountId,
        }
      );

      if (accountResult.success) {
        const transfersActive = accountResult.data.capabilities?.transfers === 'active';
        const payoutsEnabled = accountResult.data.payouts_enabled;
        
        // Worker can earn if they have active transfers and payouts enabled
        status.canEarn = transfersActive && payoutsEnabled;
        
        // Update database with current capability information using retry logic
        const updateResult = await retryStripeOperation(
          async () => {
            await db.update(UsersTable)
              .set({
                canReceivePayouts: payoutsEnabled,
                stripeAccountStatus: transfersActive && payoutsEnabled ? 'connected' : 'incomplete',
              })
              .where(eq(UsersTable.id, userRecord.id));
            return true;
          },
          {
            operation: 'database_update',
            userId: firebaseUid,
            additionalContext: {
              payoutsEnabled,
              transfersActive,
              canEarn: status.canEarn,
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
              accountId: userRecord.stripeConnectAccountId,
              error: updateResult.error,
            },
          });
        }

        logServer({
          code: 20004,
          message: 'Worker status checked successfully',
          type: 'info',
          details: {
            firebaseUid,
            accountId: userRecord.stripeConnectAccountId,
            canEarn: status.canEarn,
            transfersActive,
            payoutsEnabled,
            databaseUpdated: updateResult.success,
          },
        });


        
      } else {
        // Maintain existing canReceivePayouts value as fallback
        status.canEarn = userRecord.canReceivePayouts || false;
        
        logServer({
          ...ERROR_CODES.STRIPE_ACCOUNT_RETRIEVAL_FAILED,
          details: {
            firebaseUid,
            accountId: userRecord.stripeConnectAccountId,
            fallbackValue: status.canEarn,
          },
        });
      }
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
    if (Math.random() < 0.1) {
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
    
    // Return graceful defaults
    return getGracefulDefaults(operationName);
  }
}