/**
 * Health check utilities for Stripe integration monitoring
 */

import { stripeApi } from '@/lib/stripe-server';
import { logServer, ERROR_CODES } from '@/lib/log';
import { startPerformanceTracking, endPerformanceTracking } from '@/lib/utils/performance-monitor';
import { classifyStripeError } from './error-handler';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: HealthCheckResult[];
  timestamp: string;
}

/**
 * Perform a basic Stripe API health check
 */
export async function checkStripeApiHealth(): Promise<HealthCheckResult> {
  const startTime = startPerformanceTracking();
  
  try {
    // Simple API call to check connectivity
    await stripeApi.balance.retrieve();
    
    const responseTime = endPerformanceTracking('stripe-health-check', startTime, true).duration || 0;
    
    return {
      service: 'stripe-api',
      status: responseTime > 2000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        endpoint: 'balance.retrieve',
      },
    };
  } catch (error) {
    const responseTime = endPerformanceTracking('stripe-health-check', startTime, false, error instanceof Error ? error : String(error)).duration || 0;
    
    const errorResult = classifyStripeError(error, {
      operation: 'health-check',
    });
    
    return {
      service: 'stripe-api',
      status: 'unhealthy',
      responseTime,
      timestamp: new Date().toISOString(),
      error: errorResult.error.message,
      details: {
        endpoint: 'balance.retrieve',
        errorType: errorResult.error.details,
      },
    };
  }
}

/**
 * Check database connectivity for Stripe-related operations
 */
export async function checkDatabaseHealth(): Promise<HealthCheckResult> {
  const startTime = startPerformanceTracking();
  
  try {
    // Import db here to avoid circular dependencies
    const { db } = await import('@/lib/drizzle/db');
    const { UsersTable } = await import('@/lib/drizzle/schema');
    
    // Simple query to check database connectivity
    await db.select().from(UsersTable).limit(1);
    
    const responseTime = endPerformanceTracking('database-health-check', startTime, true).duration || 0;
    
    return {
      service: 'database',
      status: responseTime > 1000 ? 'degraded' : 'healthy',
      responseTime,
      timestamp: new Date().toISOString(),
      details: {
        query: 'users-table-select',
      },
    };
  } catch (error) {
    const responseTime = endPerformanceTracking('database-health-check', startTime, false, error instanceof Error ? error : String(error)).duration || 0;
    
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime,
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      details: {
        query: 'users-table-select',
      },
    };
  }
}

/**
 * Perform comprehensive system health check
 */
export async function performSystemHealthCheck(): Promise<SystemHealthStatus> {
  const timestamp = new Date().toISOString();
  
  logServer({
    code: 20030,
    message: 'Starting system health check',
    type: 'info',
    details: { timestamp },
  });
  
  try {
    // Run health checks in parallel
    const [stripeHealth, databaseHealth] = await Promise.allSettled([
      checkStripeApiHealth(),
      checkDatabaseHealth(),
    ]);
    
    const services: HealthCheckResult[] = [];
    
    // Process Stripe health check result
    if (stripeHealth.status === 'fulfilled') {
      services.push(stripeHealth.value);
    } else {
      services.push({
        service: 'stripe-api',
        status: 'unhealthy',
        responseTime: 0,
        timestamp,
        error: 'Health check failed to execute',
        details: { reason: stripeHealth.reason },
      });
    }
    
    // Process database health check result
    if (databaseHealth.status === 'fulfilled') {
      services.push(databaseHealth.value);
    } else {
      services.push({
        service: 'database',
        status: 'unhealthy',
        responseTime: 0,
        timestamp,
        error: 'Health check failed to execute',
        details: { reason: databaseHealth.reason },
      });
    }
    
    // Determine overall health status
    const overall = determineOverallHealth(services);
    
    const systemHealth: SystemHealthStatus = {
      overall,
      services,
      timestamp,
    };
    
    // Log health check results
    logServer({
      code: 20031,
      message: `System health check completed: ${overall}`,
      type: overall === 'healthy' ? 'info' : 'warning',
      details: systemHealth,
    });
    
    return systemHealth;
    
  } catch (error) {
    logServer({
      ...ERROR_CODES.UNKNOWN,
      message: 'System health check failed',
      details: {
        error: error instanceof Error ? error.message : String(error),
        timestamp,
      },
    });
    
    return {
      overall: 'unhealthy',
      services: [],
      timestamp,
    };
  }
}

/**
 * Determine overall system health based on individual service health
 */
function determineOverallHealth(services: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
  if (services.length === 0) {
    return 'unhealthy';
  }
  
  const unhealthyServices = services.filter(s => s.status === 'unhealthy');
  const degradedServices = services.filter(s => s.status === 'degraded');
  
  if (unhealthyServices.length > 0) {
    return 'unhealthy';
  }
  
  if (degradedServices.length > 0) {
    return 'degraded';
  }
  
  return 'healthy';
}

/**
 * Schedule periodic health checks (for use in background processes)
 */
export function scheduleHealthChecks(intervalMinutes: number = 5): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  logServer({
    code: 20032,
    message: `Scheduling health checks every ${intervalMinutes} minutes`,
    type: 'info',
    details: { intervalMinutes },
  });
  
  return setInterval(async () => {
    try {
      await performSystemHealthCheck();
    } catch (error) {
      logServer({
        ...ERROR_CODES.UNKNOWN,
        message: 'Scheduled health check failed',
        details: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }, intervalMs);
}

/**
 * Get health check summary for monitoring dashboards
 */
export async function getHealthSummary(): Promise<{
  status: string;
  uptime: number;
  lastCheck: string;
  criticalIssues: string[];
}> {
  const healthCheck = await performSystemHealthCheck();
  
  const criticalIssues = healthCheck.services
    .filter(service => service.status === 'unhealthy')
    .map(service => `${service.service}: ${service.error || 'Unknown error'}`);
  
  return {
    status: healthCheck.overall,
    uptime: process.uptime(),
    lastCheck: healthCheck.timestamp,
    criticalIssues,
  };
}