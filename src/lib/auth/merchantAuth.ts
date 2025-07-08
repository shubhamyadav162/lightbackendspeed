import { NextRequest } from 'next/server';
import { supabaseService } from '@/lib/supabase/server';

// Singleton service-role Supabase client
const supabase = supabaseService;

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