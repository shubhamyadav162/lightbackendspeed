import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 * Only accessible with API key
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const debugInfo = {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
      FRONTEND_URL: process.env.FRONTEND_URL || 'NOT_SET',
      timestamp: new Date().toISOString(),
      deployment: 'Railway Production'
    };

    return NextResponse.json({ debug: debugInfo });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 