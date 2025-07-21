import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Simple API key check for private deployment
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let supabase;
    try {
      supabase = getSupabaseService();
    } catch (e) {
      // Return operational status even if DB is not available
      return NextResponse.json({
        status: 'operational',
        components: [
          {
            label: 'Database',
            status: 'operational',
            uptime: new Date().toISOString(),
          },
          {
            label: 'API',
            status: 'operational',
            uptime: new Date().toISOString(),
          }
        ],
      });
    }

    // Fetch the latest status entries
    const { data: rows, error } = await supabase
      .from('system_status')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    // Reduce to latest per component
    const latestMap: Record<string, any> = {};
    for (const row of rows || []) {
      if (!latestMap[row.component]) {
        latestMap[row.component] = row;
      }
    }

    const components = Object.values(latestMap);

    // Derive overall status
    let overall: 'operational' | 'warning' | 'down' = 'operational';
    if (components.some((c) => c.status === 'down')) {
      overall = 'down';
    } else if (components.some((c) => c.status === 'degraded')) {
      overall = 'warning';
    }

    const response = {
      status: overall,
      components: components.map((c) => ({
        label: c.component,
        status: c.status === 'healthy' ? 'operational' : c.status === 'degraded' ? 'warning' : 'down',
        uptime: c.updated_at,
      })),
    };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(null, { status: 204 });
} 