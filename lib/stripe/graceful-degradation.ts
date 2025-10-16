/**
 * Graceful degradation strategies for Stripe service interruptions
 */

import { logServer, ERROR_CODES } from '@/lib/log';
import { DetailedStripeStatus } from '@/app/actions/stripe/types';

export interface DegradationContext {
  operation: string;
  userId?: string;
  userRole?: 'BUYER' | 'GIG_WORKER';
  errorType?: string;
  lastKnownStatus?: Partial<DetailedStripeStatus>;
}

export interface DegradationStrategy {
  fallbackStatus: DetailedStripeStatus;
  userMessage: string;
  actionRequired: boolean;
  retryAfter?: number; // seconds
}

/**
 * Get appropriate degradation strategy based on context
 */
export function getDegradationStrategy(context: DegradationContext): DegradationStrategy {
  const { operation, errorType, lastKnownStatus } = context;

  // Log the degradation event
  logServer({
    ...ERROR_CODES.STRIPE_API_ERROR,
    message: `Applying graceful degradation for ${operation}`,
    type: 'warning',
    details: context,
  });

  // Strategy for authentication failures (critical - requires immediate attention)
  if (errorType === 'StripeAuthenticationError') {
    return {
      fallbackStatus: {
        buyerConnected: false,
        canPay: false,
        workerConnected: false,
        canEarn: false,
        hasAccountDetails: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        currency: '',
        country: '',
        businessType: '',
      },
      userMessage: 'Payment system temporarily unavailable. Please try again later.',
      actionRequired: true,
      retryAfter: 300, // 5 minutes
    };
  }

  // Strategy for rate limiting (temporary - should resolve quickly)
  if (errorType === 'StripeRateLimitError') {
    return {
      fallbackStatus: lastKnownStatus ? {
        buyerConnected: lastKnownStatus.buyerConnected ?? false,
        canPay: lastKnownStatus.canPay ?? false,
        workerConnected: lastKnownStatus.workerConnected ?? false,
        canEarn: lastKnownStatus.canEarn ?? false,
        hasAccountDetails: lastKnownStatus.hasAccountDetails ?? false,
        payoutsEnabled: lastKnownStatus.payoutsEnabled ?? false,
        chargesEnabled: lastKnownStatus.chargesEnabled ?? false,
        currency: lastKnownStatus.currency ?? '',
        country: lastKnownStatus.country ?? '',
        businessType: lastKnownStatus.businessType ?? '',
      } : {
        buyerConnected: false,
        canPay: false,
        workerConnected: false,
        canEarn: false,
        hasAccountDetails: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        currency: '',
        country: '',
        businessType: '',
      },
      userMessage: 'Payment system is busy. Status information may be temporarily outdated.',
      actionRequired: false,
      retryAfter: 60, // 1 minute
    };
  }

  // Strategy for network/connection errors (temporary - retry recommended)
  if (errorType === 'StripeConnectionError' || errorType === 'timeout') {
    return {
      fallbackStatus: lastKnownStatus ? {
        buyerConnected: lastKnownStatus.buyerConnected ?? false,
        canPay: lastKnownStatus.canPay ?? false,
        workerConnected: lastKnownStatus.workerConnected ?? false,
        canEarn: lastKnownStatus.canEarn ?? false,
        hasAccountDetails: lastKnownStatus.hasAccountDetails ?? false,
        payoutsEnabled: lastKnownStatus.payoutsEnabled ?? false,
        chargesEnabled: lastKnownStatus.chargesEnabled ?? false,
        currency: lastKnownStatus.currency ?? '',
        country: lastKnownStatus.country ?? '',
        businessType: lastKnownStatus.businessType ?? '',
      } : {
        buyerConnected: false,
        canPay: false,
        workerConnected: false,
        canEarn: false,
        hasAccountDetails: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        currency: '',
        country: '',
        businessType: '',
      },
      userMessage: 'Connection to payment system interrupted. Showing last known status.',
      actionRequired: false,
      retryAfter: 30, // 30 seconds
    };
  }

  // Strategy for permission errors (requires user action)
  if (errorType === 'StripePermissionError') {
    return {
      fallbackStatus: {
        buyerConnected: false,
        canPay: false,
        workerConnected: false,
        canEarn: false,
        hasAccountDetails: false,
        payoutsEnabled: false,
        chargesEnabled: false,
        currency: '',
        country: '',
        businessType: '',
      },
      userMessage: 'Payment account access restricted. Please contact support.',
      actionRequired: true,
    };
  }

  // Default strategy for unknown errors
  return {
    fallbackStatus: {
      buyerConnected: false,
      canPay: false,
      workerConnected: false,
      canEarn: false,
      hasAccountDetails: false,
      payoutsEnabled: false,
      chargesEnabled: false,
      currency: '',
      country: '',
      businessType: '',
    },
    userMessage: 'Payment status temporarily unavailable. Please refresh the page.',
    actionRequired: false,
    retryAfter: 120, // 2 minutes
  };
}

/**
 * Check if the system should attempt to recover from degraded state
 */
export function shouldAttemptRecovery(
  lastDegradationTime: number,
  retryAfter: number = 60
): boolean {
  const now = Date.now();
  const timeSinceLastDegradation = (now - lastDegradationTime) / 1000; // seconds

  return timeSinceLastDegradation >= retryAfter;
}

/**
 * Get user-friendly error message based on degradation context
 */
export function getUserFriendlyMessage(
  context: DegradationContext,
  strategy: DegradationStrategy
): string {
  const { userRole } = context;

  let roleSpecificMessage = '';

  if (userRole === 'BUYER') {
    roleSpecificMessage = strategy.actionRequired
      ? ' You may not be able to make payments until this is resolved.'
      : ' Payment functionality may be limited.';
  } else if (userRole === 'GIG_WORKER') {
    roleSpecificMessage = strategy.actionRequired
      ? ' You may not be able to receive earnings until this is resolved.'
      : ' Earnings functionality may be limited.';
  }

  return strategy.userMessage + roleSpecificMessage;
}

/**
 * Log degradation recovery when service is restored
 */
export function logDegradationRecovery(context: DegradationContext): void {
  logServer({
    code: 20020,
    message: `Service recovered from degradation for ${context.operation}`,
    type: 'info',
    details: {
      ...context,
      recoveryTime: new Date().toISOString(),
    },
  });
}

/**
 * Create a circuit breaker pattern for Stripe operations
 */
export class StripeCircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000, // 1 minute
    private readonly operation = 'stripe-operation'
  ) { }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = 'half-open';
        logServer({
          code: 20021,
          message: `Circuit breaker transitioning to half-open for ${this.operation}`,
          type: 'info',
          details: {
            operation: this.operation,
            failureCount: this.failureCount,
          },
        });
      } else {
        throw new Error(`Circuit breaker is open for ${this.operation}`);
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.reset();
        logServer({
          code: 20022,
          message: `Circuit breaker recovered for ${this.operation}`,
          type: 'info',
          details: {
            operation: this.operation,
          },
        });
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      logServer({
        ...ERROR_CODES.STRIPE_API_ERROR,
        message: `Circuit breaker opened for ${this.operation}`,
        details: {
          operation: this.operation,
          failureCount: this.failureCount,
          threshold: this.failureThreshold,
        },
      });
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }

  getState(): { state: string; failureCount: number; lastFailureTime: number } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }
}