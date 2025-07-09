import { getSupabaseService } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

const supabase = getSupabaseService();

/**
 * Legacy header auth fallback used by existing merchant SDK integrations.
 * Returns merchant row if credentials are valid; otherwise throws.
 */
export async function verifyMerchantAuth(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const apiSecret = request.headers.get('x-api-secret');

  if (!apiKey || !apiSecret) return null;

  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data || data.api_salt !== apiSecret) {
    throw new Error('Invalid API credentials');
  }

  return data;
} 