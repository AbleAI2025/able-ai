/**
 * Stripe-specific error handling utilities with comprehensive error classification
 */

import Stripe from 'stripe';
import { logServer, ERROR_CODES, AppLogError } from '@/lib/log';
import { getErrorMessage } from '@/lib/utils/errors';

export interface StripeErrorContext {
  operation: string;
  userId?: string;
  stripeId?: string;
  additionalContext?: Record<string, unknown>;
}

export interface StripeErrorResult {
  success: false;
  error: AppLogError;
  shouldRetry: boolean;
  fallbackValue?: unknown;
}

export interface StripeSuccessResult<T> {
  success: true;
  data: T;
}

export type StripeResult<T> = StripeSuccessResult<T> | StripeErrorResult;

/**
 * Classify Stripe errors and determine appropriate handling strategy
 */
export function classifyStripeError(error: unknown, context: StripeErrorContext): StripeErrorResult {
  let appError: AppLogError;
  let shouldRetry = false;

  if (error instanceof Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeConnectionError':
      case 'StripeAPIError':
        appError = {
          ...ERROR_CODES.STRIPE_API_ERROR,
          details: {
            stripeErrorType: error.type,
            stripeErrorCode: error.code,
            message: error.message,
            context,
          },
        };
        shouldRetry = true; // Network issues might be temporary
        break;

      case 'StripeRateLimitError':
        appError = {
          ...ERROR_CODES.STRIPE_RATE_LIMIT_EXCEEDED,
          details: {
            stripeErrorType: error.type,
            message: error.message,
            context,
          },
        };
        shouldRetry = true; // Rate limits are temporary
        break;

      case 'StripeAuthenticationError':
        appError = {
          ...ERROR_CODES.STRIPE_AUTHENTICATION_FAILED,
          details: {
            stripeErrorType: error.type,
            message: error.message,
            context,
          },
        };
        shouldRetry = false; // Auth errors need manual intervention
        break;

      case 'StripePermissionError':
        appError = {
          ...ERROR_CODES.PERMISSION_DENIED,
          message: 'Stripe permission error',
          details: {
            stripeErrorType: error.type,
            message: error.message,
            context,
          },
        };
        shouldRetry = false; // Permission errors need manual intervention
        break;

      case 'StripeInvalidRequestError':
        appError = {
          ...ERROR_CODES.INVALID_INPUT,
          message: 'Invalid Stripe request',
          details: {
            stripeErrorType: error.type,
            stripeErrorCode: error.code,
            message: error.message,
            context,
          },
        };
        shouldRetry = false; // Invalid requests won't succeed on retry
        break;

      default:
        appError = {
          ...ERROR_CODES.STRIPE_API_ERROR,
          details: {
            stripeErrorType: error.type,
            stripeErrorCode: error.code,
            message: error.message,
            context,
          },
        };
        shouldRetry = false;
    }
  } else if (error instanceof Error) {
    // Handle timeout errors
    if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      appError = {
        ...ERROR_CODES.STRIPE_API_TIMEOUT,
        details: {
          message: error.message,
          context,
        },
      };
      shouldRetry = true;
    } else {
      appError = {
        ...ERROR_CODES.STRIPE_API_ERROR,
        details: {
          message: error.message,
          context,
        },
      };
      shouldRetry = false;
    }
  } else {
    appError = {
      ...ERROR_CODES.UNKNOWN,
      message: 'Unknown Stripe error',
      details: {
        error: getErrorMessage(error),
        context,
      },
    };
    shouldRetry = false;
  }

  // Log the error
  logServer(appError);

  return {
    success: false,
    error: appError,
    shouldRetry,
  };
}

/**
 * Handle Stripe customer retrieval with comprehensive error handling
 */
export async function handleStripeCustomerRetrieval(
  stripeApi: Stripe,
  customerId: string,
  context: StripeErrorContext
): Promise<StripeResult<Stripe.Customer>> {
  try {
    const customer = await stripeApi.customers.retrieve(customerId);
    return {
      success: true,
      data: customer as Stripe.Customer,
    };
  } catch (error) {
    const errorResult = classifyStripeError(error, {
      ...context,
      operation: 'customer_retrieval',
      stripeId: customerId,
    });

    // Add specific error code for customer retrieval
    errorResult.error = {
      ...ERROR_CODES.STRIPE_CUSTOMER_RETRIEVAL_FAILED,
      details: errorResult.error.details,
    };

    return errorResult;
  }
}

/**
 * Handle Stripe Connect account retrieval with comprehensive error handling
 */
export async function handleStripeAccountRetrieval(
  stripeApi: Stripe,
  accountId: string,
  context: StripeErrorContext
): Promise<StripeResult<Stripe.Account>> {
  try {
    const account = await stripeApi.accounts.retrieve(accountId);
    return {
      success: true,
      data: account,
    };
  } catch (error) {
    const errorResult = classifyStripeError(error, {
      ...context,
      operation: 'account_retrieval',
      stripeId: accountId,
    });

    // Add specific error code for account retrieval
    errorResult.error = {
      ...ERROR_CODES.STRIPE_ACCOUNT_RETRIEVAL_FAILED,
      details: errorResult.error.details,
    };

    return errorResult;
  }
}

/**
 * Graceful degradation strategy for Stripe operations
 */
export function getGracefulDefaults(operation: string): {
  buyerConnected: boolean;
  canPay: boolean;
  workerConnected: boolean;
  canEarn: boolean;
} {
  // Log the degradation
  logServer({
    ...ERROR_CODES.STRIPE_API_ERROR,
    message: `Using graceful defaults for ${operation}`,
    type: 'warning',
    details: { operation },
  });

  return {
    buyerConnected: false,
    canPay: false,
    workerConnected: false,
    canEarn: false,
  };
}

/**
 * Retry logic for transient Stripe errors
 */
export async function retryStripeOperation<T>(
  operation: () => Promise<T>,
  context: StripeErrorContext,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<StripeResult<T>> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      lastError = error;
      const errorResult = classifyStripeError(error, context);

      // Don't retry if the error is not retryable
      if (!errorResult.shouldRetry || attempt === maxRetries) {
        return errorResult;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));

      logServer({
        ...ERROR_CODES.STRIPE_API_ERROR,
        message: `Retrying Stripe operation (attempt ${attempt + 1}/${maxRetries})`,
        type: 'warning',
        details: {
          context,
          attempt: attempt + 1,
          maxRetries,
          delay,
        },
      });
    }
  }

  // This should never be reached, but TypeScript requires it
  return classifyStripeError(lastError, context);
}