import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Railway deployment test successful!',
    timestamp: new Date().toISOString(),
    version: '0.1.1',
    buildId: 'NEW_BUILD_' + Date.now()
  });
} 