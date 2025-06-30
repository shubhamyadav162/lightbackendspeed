import { NextResponse } from 'next/server';

// RAILWAY HEALTH CHECK ENDPOINT - DIRECT /health PATH
// Some platforms expect health endpoint at root /health instead of /api/health
export async function GET() {
  return NextResponse.json(
    { 
      status: 'healthy',
      service: 'lightspeedpay-backend',
      timestamp: new Date().toISOString(),
      port: process.env.PORT || '3100'
    }, 
    { status: 200 }
  );
}

// Support HEAD requests for Railway health checks  
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
} 