import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client (service role)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type ComponentStatus = {
  component: string;
  status: string; // healthy | degraded | down
  response_time_ms?: number | null;
  message?: string | null;
  updated_at: string;
};

export async function GET(_request: NextRequest) {
  try {
    // Fetch the latest status entries (per component)
    const { data: rows, error } = await supabase
      .from('system_status')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (error) {
      throw new Error(error.message);
    }

    // Reduce to latest per component
    const latestMap: Record<string, ComponentStatus> = {};
    for (const row of rows as ComponentStatus[]) {
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