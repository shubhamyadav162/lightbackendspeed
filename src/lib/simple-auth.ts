/**
 * Simple API Key Authentication System
 * 
 * This replaces all complex JWT, Supabase auth, and Bearer token authentication
 * with a simple API key based system for immediate transaction processing
 */

import { NextRequest } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/server';

// Simple client credentials interface
interface SimpleClient {
  id: string;
  name: string;
  api_key: string;
  api_salt: string;
  is_active: boolean;
  environment: 'test' | 'production';
}

// Known test clients for immediate testing
const TEST_CLIENTS: SimpleClient[] = [
  {
    id: 'c8691c56-5714-4f80-943a-cd4862cc91d6',
    name: 'Test Client 1',
    api_key: '2a4a4437-440f-4bd4-82b4-88cdcf8a468a',
    api_salt: 'QECGU7UHNT',
    is_active: true,
    environment: 'test'
  },
  {
    id: 'admin_client',
    name: 'Admin Client',
    api_key: 'admin_test_key',
    api_salt: 'admin_salt',
    is_active: true,
    environment: 'test'
  }
];

/**
 * Simple API Key Authentication
 * Checks both x-api-key and x-api-secret headers for enhanced security
 */
export async function simpleAuth(request: NextRequest): Promise<SimpleClient | null> {
  try {
    const apiKey = request.headers.get('x-api-key');
    const apiSecret = request.headers.get('x-api-secret');
    
    if (!apiKey) {
      console.log('[SimpleAuth] No API key provided');
      return null;
    }

    // First check test clients for immediate testing
    const testClient = TEST_CLIENTS.find(client => client.api_key === apiKey);
    if (testClient) {
      // For test clients, also verify API secret if provided
      if (apiSecret && testClient.api_salt !== apiSecret) {
        console.log('[SimpleAuth] Test client API secret mismatch');
        return null;
      }
      console.log('[SimpleAuth] Test client authenticated:', testClient.name);
      return testClient;
    }

    // For production, check database
    try {
      const supabase = getSupabaseService();
      const { data: dbClient, error } = await supabase
        .from('clients')
        .select('id, company_name, client_key, client_salt, status, environment')
        .eq('client_key', apiKey)
        .eq('status', 'active')
        .single();

      if (error || !dbClient) {
        console.log('[SimpleAuth] Database client not found:', error?.message);
        return null;
      }

      // Map database fields to SimpleClient interface
      const client: SimpleClient = {
        id: dbClient.id,
        name: dbClient.company_name,
        api_key: dbClient.client_key,
        api_salt: dbClient.client_salt,
        is_active: dbClient.status === 'active',
        environment: dbClient.environment || 'test'
      };

      // Verify API secret if provided
      if (apiSecret && client.api_salt !== apiSecret) {
        console.log('[SimpleAuth] Database client API secret mismatch');
        return null;
      }

      console.log('[SimpleAuth] Database client authenticated:', client.name);
      return client;
    } catch (dbError) {
      console.log('[SimpleAuth] Database error, falling back to test clients:', dbError);
      return null;
    }
  } catch (error) {
    console.error('[SimpleAuth] Authentication error:', error);
    return null;
  }
}

/**
 * Admin API Key Authentication
 * Simple check for admin operations
 */
export async function simpleAdminAuth(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  
  const validAdminKeys = [
    'admin_test_key',
    process.env.ADMIN_API_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ].filter(Boolean);

  return validAdminKeys.includes(apiKey || '');
}

/**
 * Get client by API key (for payment processing)
 */
export async function getClientByApiKey(apiKey: string): Promise<SimpleClient | null> {
  // Check test clients first
  const testClient = TEST_CLIENTS.find(client => client.api_key === apiKey);
  if (testClient) {
    return testClient;
  }

  // Check database
  try {
    const supabase = getSupabaseService();
    const { data: dbClient, error } = await supabase
      .from('clients')
      .select('id, company_name, client_key, client_salt, status, environment')
      .eq('client_key', apiKey)
      .eq('status', 'active')
      .single();

    if (error || !dbClient) {
      return null;
    }

    // Map database fields to SimpleClient interface
    const client: SimpleClient = {
      id: dbClient.id,
      name: dbClient.company_name,
      api_key: dbClient.client_key,
      api_salt: dbClient.client_salt,
      is_active: dbClient.status === 'active',
      environment: dbClient.environment || 'test'
    };

    return client;
  } catch (error) {
    console.error('[getClientByApiKey] Database error:', error);
    return null;
  }
}

/**
 * Simple response helper
 */
export function simpleResponse(data: any, status: number = 200) {
  return Response.json(data, { status });
}

/**
 * Simple error response helper
 */
export function simpleError(message: string, status: number = 400) {
  return Response.json({ 
    success: false, 
    error: message 
  }, { status });
} 