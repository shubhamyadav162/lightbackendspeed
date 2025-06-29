import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo Data Setup API - SIMPLIFIED FOR DEBUGGING
 * POST /api/v1/admin/demo - Add demo clients and data for testing
 */
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Demo endpoint is working - POST method',
      timestamp: new Date().toISOString(),
      method: 'POST'
    });

  } catch (error) {
    console.error('Demo setup error:', error);
    return NextResponse.json(
      { error: 'Demo setup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Demo endpoint is working - GET method', 
      timestamp: new Date().toISOString(),
      method: 'GET',
      url: request.url
    });

  } catch (error: any) {
    console.error('❌ Demo check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check demo data',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
} 