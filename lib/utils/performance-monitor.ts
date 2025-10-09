/**
 * Performance monitoring utilities for tracking API call performance and success rates
 */

import { logServer, ERROR_CODES } from '@/lib/log';

export interface PerformanceMetrics {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface ApiCallMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  successRate: number;
}

// In-memory metrics storage (in production, this would be sent to a monitoring service)
const metricsStore = new Map<string, PerformanceMetrics[]>();

/**
 * Start tracking performance for an operation
 */
export function startPerformanceTracking(): number {
  return Date.now();
}

/**
 * End performance tracking and log the results
 */
export function endPerformanceTracking(
  operation: string,
  startTime: number,
  success: boolean,
  error?: Error | string
): PerformanceMetrics {
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  const metrics: PerformanceMetrics = {
    operation,
    startTime,
    endTime,
    duration,
    success,
    errorCode: error instanceof Error ? error.name : undefined,
    errorMessage: error instanceof Error ? error.message : typeof error === 'string' ? error : undefined,
  };

  // Store metrics
  if (!metricsStore.has(operation)) {
    metricsStore.set(operation, []);
  }
  metricsStore.get(operation)!.push(metrics);

  // Log performance issues
  if (duration > 3000) { // More than 3 seconds
    logServer({
      ...ERROR_CODES.STRIPE_API_TIMEOUT,
      details: {
        operation,
        duration,
        success,
        error: error?.toString(),
      },
    });
  }

  // Log successful operations for analytics
  if (success) {
    logServer({
      code: 20001,
      message: `${operation} completed successfully`,
      type: 'analytics',
      details: {
        operation,
        duration,
      },
    });
  }

  return metrics;
}

/**
 * Get aggregated metrics for an operation
 */
export function getOperationMetrics(operation: string): ApiCallMetrics | null {
  const operationMetrics = metricsStore.get(operation);
  if (!operationMetrics || operationMetrics.length === 0) {
    return null;
  }

  const totalCalls = operationMetrics.length;
  const successfulCalls = operationMetrics.filter(m => m.success).length;
  const failedCalls = totalCalls - successfulCalls;
  const averageResponseTime = operationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / totalCalls;
  const successRate = (successfulCalls / totalCalls) * 100;

  return {
    totalCalls,
    successfulCalls,
    failedCalls,
    averageResponseTime,
    successRate,
  };
}



/**
 * Log performance summary for monitoring
 */
export function logPerformanceSummary(operation: string): void {
  const metrics = getOperationMetrics(operation);
  if (!metrics) {
    return;
  }

  logServer({
    code: 20002,
    message: `Performance summary for ${operation}`,
    type: 'analytics',
    details: metrics,
  });

  // Alert if success rate is below threshold
  if (metrics.successRate < 95) {
    logServer({
      ...ERROR_CODES.STRIPE_API_ERROR,
      message: `Low success rate detected for ${operation}`,
      details: {
        operation,
        successRate: metrics.successRate,
        totalCalls: metrics.totalCalls,
      },
    });
  }

  // Alert if average response time is too high
  if (metrics.averageResponseTime > 2000) {
    logServer({
      ...ERROR_CODES.STRIPE_API_TIMEOUT,
      message: `High response time detected for ${operation}`,
      details: {
        operation,
        averageResponseTime: metrics.averageResponseTime,
        totalCalls: metrics.totalCalls,
      },
    });
  }
}