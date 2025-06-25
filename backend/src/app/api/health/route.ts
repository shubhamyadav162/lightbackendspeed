import { NextResponse } from 'next/server';

// ULTRA SIMPLE HEALTH CHECK FOR RAILWAY DEPLOYMENT
// No dependencies, no complex logic - just return 200 OK
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