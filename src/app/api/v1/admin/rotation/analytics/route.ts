import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/v1/admin/rotation/analytics
 * Get rotation analytics and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key');
    if (apiKey !== 'admin_test_key') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('client_id');
    const days = parseInt(searchParams.get('days') || '7');

    if (!clientId) {
      return NextResponse.json({ 
        error: 'client_id parameter required' 
      }, { status: 400 });
    }

    // Get rotation statistics using stored procedure
    const { data: rotationStats, error: statsError } = await supabase
      .rpc('get_client_rotation_stats', {
        p_client_id: clientId,
        p_days: days
      });

    if (statsError) {
      return NextResponse.json({ error: statsError.message }, { status: 500 });
    }

    // Get current client rotation status
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        company_name,
        rotation_mode,
        current_rotation_position,
        total_assigned_gateways,
        last_rotation_at,
        rotation_reset_daily
      `)
      .eq('id', clientId)
      .single();

    if (clientError) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Calculate distribution metrics
    const totalTransactions = rotationStats.reduce((sum: number, stat: any) => sum + parseInt(stat.transactions_count), 0);
    const totalAmount = rotationStats.reduce((sum: number, stat: any) => sum + parseInt(stat.total_amount), 0);

    const distributionAnalysis = rotationStats.map((stat: any) => ({
      ...stat,
      transaction_percentage: totalTransactions > 0 ? (parseInt(stat.transactions_count) / totalTransactions * 100).toFixed(2) : '0',
      amount_percentage: totalAmount > 0 ? (parseInt(stat.total_amount) / totalAmount * 100).toFixed(2) : '0',
      avg_amount_formatted: (parseInt(stat.avg_amount) / 100).toFixed(2), // Convert paisa to rupees
      total_amount_formatted: (parseInt(stat.total_amount) / 100).toFixed(2)
    }));

    // Check distribution evenness (ideal would be equal distribution)
    const idealPercentage = rotationStats.length > 0 ? (100 / rotationStats.length) : 0;
    const distributionVariance = rotationStats.reduce((variance: number, stat: any) => {
      const actualPercentage = totalTransactions > 0 ? (parseInt(stat.transactions_count) / totalTransactions * 100) : 0;
      return variance + Math.pow(actualPercentage - idealPercentage, 2);
    }, 0) / rotationStats.length;

    return NextResponse.json({
      client_info: client,
      period_days: days,
      rotation_stats: distributionAnalysis,
      summary: {
        total_transactions: totalTransactions,
        total_amount_paisa: totalAmount,
        total_amount_rupees: (totalAmount / 100).toFixed(2),
        active_gateways: rotationStats.length,
        distribution_variance: distributionVariance.toFixed(2),
        distribution_quality: distributionVariance < 10 ? 'Excellent' : distributionVariance < 25 ? 'Good' : 'Needs Improvement',
        ideal_percentage_per_gateway: idealPercentage.toFixed(2)
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 