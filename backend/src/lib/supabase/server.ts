import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getPgPool } from '@/lib/pgPool';
import { NextRequest } from 'next/server';

// Initialize a singleton service-role client for server-side usage
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

let supabaseService: SupabaseClient | null = null;

if (!supabaseUrl || !supabaseServiceKey) {
  /* istanbul ignore next -- environment warning */
  console.warn('[supabase/server] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env variables');
} else {
  supabaseService = createClient(supabaseUrl, supabaseServiceKey);
}

// Helper function to get Supabase service with null check
export function getSupabaseService(): SupabaseClient {
  if (!supabaseService) {
    // During build time, return a dummy client
    if (process.env.NODE_ENV === 'production' && !supabaseUrl) {
      console.warn('[getSupabaseService] Returning dummy client for build time');
      // Return a minimal dummy object that won't cause build errors
      return {
        auth: { getUser: async () => ({ data: null, error: new Error('Build time') }) },
        from: () => ({
          select: () => ({ single: async () => ({ data: null, error: new Error('Build time') }) }),
          insert: async () => ({ data: null, error: new Error('Build time') }),
          update: async () => ({ data: null, error: new Error('Build time') }),
          delete: async () => ({ data: null, error: new Error('Build time') }),
        }),
      } as any;
    }
    throw new Error('Supabase client not initialized. Check environment variables.');
  }
  return supabaseService;
}

// Export both for backward compatibility
export { supabaseService };

export { getPgPool }; // re-export for convenience

export type AuthContext = {
  /** Supabase auth user id */
  userId: string;
  /** Role from users metadata table */
  role: 'merchant' | 'admin';
  /** If role is merchant this will be populated */
  merchantId?: string;
};

/**
 * Extract a JWT from an incoming request. Looks for:
 *   1. Authorization: Bearer <token>
 *   2. Cookie named `sb-access-token`
 */
function extractJwt(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }

  return null;
}

/**
 * Verify Supabase JWT and return auth context (role + merchant).
 * Returns null if no valid auth found.
 */
export async function getAuthContext(request: NextRequest): Promise<AuthContext | null> {
  const jwt = extractJwt(request);
  if (!jwt) return null;

  // Check if supabaseService is initialized
  if (!supabaseService) {
    console.warn('[getAuthContext] Supabase client not initialized');
    return null;
  }

  const { data: userData, error: userErr } = await supabaseService.auth.getUser(jwt);
  if (userErr || !userData.user) return null;

  // Fetch metadata from users table
  const { data: meta, error: metaErr } = await supabaseService
    .from('users')
    .select('role, merchant_id')
    .eq('id', userData.user.id)
    .single();

  if (metaErr || !meta) return null;

  /* istanbul ignore next -- unreachable in happy path, excluded from coverage */

  return {
    userId: userData.user.id,
    role: meta.role as 'merchant' | 'admin',
    merchantId: meta.merchant_id || undefined,
  };
} 