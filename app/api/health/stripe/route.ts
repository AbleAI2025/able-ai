/**
 * Health check API endpoint for Stripe integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { performSystemHealthCheck, getHealthSummary } from '@/lib/stripe/health-check';
import { logServer, ERROR_CODES } from '@/lib/log';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';
    
    if (detailed) {
      // Return detailed health check
      const healthStatus = await performSystemHealthCheck();
      
      return NextResponse.json(healthStatus, {
        status: healthStatus.overall === 'healthy' ? 200 : 
               healthStatus.overall === 'degraded' ? 206 : 503,
      });
    } else {
      // Return summary health check
      const summary = await getHealthSummary();
      
      return NextResponse.json(summary, {
        status: summary.status === 'healthy' ? 200 :
               summary.status === 'degraded' ? 206 : 503,
      });
    }
  } catch (error) {
    logServer({
      ...ERROR_CODES.UNKNOWN,
      message: 'Health check endpoint error',
      details: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest) {
  try {
    const summary = await getHealthSummary();
    
    return new NextResponse(null, {
      status: summary.status === 'healthy' ? 200 :
             summary.status === 'degraded' ? 206 : 503,
      headers: {
        'X-Health-Status': summary.status,
        'X-Last-Check': summary.lastCheck,
      },
    });
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        'X-Health-Status': 'unhealthy',
      },
    });
  }
}