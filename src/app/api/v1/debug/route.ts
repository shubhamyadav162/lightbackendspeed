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

    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET ✅' : 'MISSING ❌',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET ✅' : 'MISSING ❌',
      PORT: process.env.PORT,
      // Show partial values for debugging (security safe)
      SUPABASE_URL_PARTIAL: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 20) + '...' : 'NOT SET',
      SERVICE_KEY_PARTIAL: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...' : 'NOT SET'
    };

    return NextResponse.json({
      status: 'debug-info',
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 