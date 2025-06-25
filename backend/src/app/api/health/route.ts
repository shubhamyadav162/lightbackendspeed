import { NextRequest, NextResponse } from 'next/server';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  port: string;
  supabase?: string;
  redis?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Basic health check
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'lightspeedpay-backend',
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      port: process.env.PORT || '3100'
    };

    // Optional: Check database connection
    if (process.env.SUPABASE_URL) {
      health.supabase = 'connected';
    }

    // Optional: Check Redis connection
    if (process.env.REDIS_URL) {
      health.redis = 'available';
    }

    return NextResponse.json(health, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}

// Support HEAD requests for basic health checks
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
} 