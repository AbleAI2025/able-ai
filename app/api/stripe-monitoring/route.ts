/**
 * API endpoint for monitoring Stripe operations performance and health
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllMetrics, getOperationMetrics } from '@/lib/utils/performance-monitor';
import { logServer, ERROR_CODES } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operation = searchParams.get('operation');
    
    // Log monitoring request
    logServer({
      code: 20010,
      message: 'Stripe monitoring endpoint accessed',
      type: 'analytics',
      details: {
        operation,
        timestamp: new Date().toISOString(),
      },
    });

    if (operation) {
      // Get metrics for specific operation
      const metrics = getOperationMetrics(operation);
      
      if (!metrics) {
        return NextResponse.json(
          { 
            error: 'No metrics found for operation',
            operation 
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        operation,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Get all metrics
      const allMetrics = getAllMetrics();
      
      return NextResponse.json({
        metrics: allMetrics,
        timestamp: new Date().toISOString(),
        summary: {
          totalOperations: Object.keys(allMetrics).length,
          healthStatus: calculateHealthStatus(allMetrics),
        },
      });
    }
  } catch (error) {
    logServer({
      ...ERROR_CODES.UNKNOWN,
      message: 'Error in Stripe monitoring endpoint',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      { 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate overall health status based on metrics
 */
function calculateHealthStatus(metrics: Record<string, any>): {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
} {
  const issues: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  for (const [operation, operationMetrics] of Object.entries(metrics)) {
    // Check success rate
    if (operationMetrics.successRate < 95) {
      issues.push(`${operation}: Low success rate (${operationMetrics.successRate.toFixed(1)}%)`);
      status = operationMetrics.successRate < 90 ? 'critical' : 'warning';
    }

    // Check response time
    if (operationMetrics.averageResponseTime > 3000) {
      issues.push(`${operation}: High response time (${operationMetrics.averageResponseTime.toFixed(0)}ms)`);
      if (status !== 'critical') {
        status = 'warning';
      }
    }

    // Check if there are recent failures
    if (operationMetrics.failedCalls > 0 && operationMetrics.totalCalls > 0) {
      const failureRate = (operationMetrics.failedCalls / operationMetrics.totalCalls) * 100;
      if (failureRate > 10) {
        issues.push(`${operation}: High failure rate (${failureRate.toFixed(1)}%)`);
        status = failureRate > 20 ? 'critical' : 'warning';
      }
    }
  }

  return { status, issues };
}