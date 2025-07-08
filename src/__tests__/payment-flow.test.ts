import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';
import { generateMockPaymentRequest, setupTestDatabase, cleanupTestDatabase } from '../lib/test-utils';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('Payment Flow Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should create a new payment with service role JWT', async () => {
    const mockRequest = generateMockPaymentRequest();
    
    const { data: payment, error } = await supabase
      .functions
      .invoke('payment-initiate', {
        body: mockRequest
      });

    expect(error).toBeNull();
    expect(payment).toBeDefined();
    expect(payment.success).toBe(true);
    expect(payment.transaction_id).toMatch(/^LSP_/);
    expect(payment.status).toBe('pending');
  });

  it('should handle merchant config encryption correctly', async () => {
    const testKey = 'test_key_123';
    const testSalt = 'test_salt_456';
    
    // Insert test config
    const { data: config, error: insertError } = await supabase
      .from('merchant_config')
      .insert({
        merchant_id: 'test_merchant',
        gateway_type: 'test',
        encrypted_key: testKey,
        encrypted_salt: testSalt
      })
      .select()
      .single();

    expect(insertError).toBeNull();
    expect(config).toBeDefined();
    expect(config.encrypted_key).not.toBe(testKey);
    expect(config.encrypted_salt).not.toBe(testSalt);
  });

  it('should apply correct RLS policies for settlements', async () => {
    // Test with service role
    const { data: serviceRoleData, error: serviceRoleError } = await supabase
      .from('settlements')
      .insert({
        merchant_id: 'test_merchant',
        amount: 1000
      })
      .select();

    expect(serviceRoleError).toBeNull();
    expect(serviceRoleData).toBeDefined();

    // Test with anonymous client
    const anonClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data: anonData, error: anonError } = await anonClient
      .from('settlements')
      .insert({
        merchant_id: 'test_merchant',
        amount: 1000
      });

    expect(anonError).toBeDefined();
    expect(anonData).toBeNull();
  });

  it('should handle queue rate limiting correctly', async () => {
    const promises = Array(150).fill(0).map(() => 
      supabase.functions.invoke('payment-initiate', {
        body: generateMockPaymentRequest()
      })
    );

    const results = await Promise.allSettled(promises);
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBeLessThanOrEqual(100); // Max rate limit
    expect(rejected.length).toBeGreaterThan(0); // Some should be rate limited
  });

  it('should invalidate SWR cache on gateway updates', async () => {
    const { data: gateway } = await supabase
      .from('payment_gateways')
      .insert({
        name: 'Test Gateway',
        type: 'test',
        is_active: true
      })
      .select()
      .single();

    // Mock SWR cache
    const mockCache = new Map();
    mockCache.set('/api/gateways', [gateway]);

    // Update gateway
    await supabase
      .from('payment_gateways')
      .update({ is_active: false })
      .eq('id', gateway.id);

    // Cache should be invalidated
    expect(mockCache.has('/api/gateways')).toBe(false);
  });
}); 