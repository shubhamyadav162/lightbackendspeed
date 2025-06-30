import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const shouldRun = process.env.PLAYWRIGHT_E2E === '1';

test.skip(!shouldRun, 'E2E tests are skipped by default – set PLAYWRIGHT_E2E=1 to enable');

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Deterministic IDs for cleanup
const CLIENT_KEY = `e2e_${Date.now()}`;
const WALLET_ID = randomUUID();
const COMM_ENTRY_ID = randomUUID();

let supabase: any;

async function setupTestData() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) throw new Error('Missing Supabase env vars');
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  // Insert client
  await supabase.from('clients').insert({
    id: randomUUID(),
    client_key: CLIENT_KEY,
    client_salt: 'test_salt',
    company_name: 'E2E Test Merchant',
  });
  // Insert wallet row
  await supabase.from('wallets').insert({
    id: WALLET_ID,
    client_id: (await supabase.from('clients').select('id').eq('client_key', CLIENT_KEY).single()).data!.id,
    balance_due: 0,
  });
  // Insert commission entry row
  await supabase.from('commission_entries').insert({
    id: COMM_ENTRY_ID,
    wallet_id: WALLET_ID,
    amount: 500,
    type: 'COMMISSION',
  });
}

async function cleanupTestData() {
  if (!supabase) return;
  await supabase.from('commission_entries').delete().eq('id', COMM_ENTRY_ID);
  await supabase.from('wallets').delete().eq('id', WALLET_ID);
  await supabase.from('clients').delete().eq('client_key', CLIENT_KEY);
}

test.describe('Commission Ledger – admin endpoint', () => {
  test.beforeAll(async () => {
    await setupTestData();
  });
  test.afterAll(async () => {
    await cleanupTestData();
  });

  test('should return commission ledger rows including latest entry', async ({ request }) => {
    const res = await request.get(`${baseURL}/admin/commission/ledger`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    // Should contain at least one entry with our inserted amount
    const match = (json as any[]).find((r: any) => r.id === COMM_ENTRY_ID || r.entry_id === COMM_ENTRY_ID);
    expect(match).toBeTruthy();
    expect(match.amount).toBe(500);
  });
}); 