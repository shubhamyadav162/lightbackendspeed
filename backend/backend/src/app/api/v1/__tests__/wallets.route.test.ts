// @ts-nocheck
/* eslint-disable */

/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/v1/wallets/route';

// ---------------------------------------------------------------------------
// Mock Supabase server utilities (supabaseService & getAuthContext)
// ---------------------------------------------------------------------------

jest.mock('@/lib/supabase/server', () => {
  const createBuilder = (result) => {
    const promise = Promise.resolve(result);
    const builder = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      single: jest.fn(() => promise),
      then: promise.then.bind(promise),
    };
    return builder;
  };

  const fromMock = jest.fn();
  const __setNextResults = (...results) => {
    fromMock.mockReset();
    results.forEach((res) => {
      fromMock.mockImplementationOnce(() => createBuilder(res));
    });
  };

  return {
    supabaseService: {
      from: fromMock,
      auth: { getUser: jest.fn() },
    },
    getAuthContext: jest.fn(),
    __setNextResults,
  };
});

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { getAuthContext, __setNextResults } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Helper to build minimal Request-like objects expected by route handlers
// ---------------------------------------------------------------------------
function buildRequest({ url = 'http://localhost/api/v1/wallets', headers = {}, jsonBody } = {}) {
  return {
    url,
    headers: new Headers(headers),
    json: jsonBody ? async () => jsonBody : undefined,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Wallets API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns wallets and transactions for merchant', async () => {
    // Mock auth context
    getAuthContext.mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });

    const wallets = [{ id: 'wallet-1', merchant_id: 'm1', balance: 1000 }];
    const transactions = [{ id: 'txn-1', wallet_id: 'wallet-1', amount: 100 }];

    // First call for wallets, second for transactions
    __setNextResults({ data: wallets, error: null }, { data: transactions, error: null });

    const req = buildRequest({ url: 'http://localhost/api/v1/wallets?includeTransactions=true' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.wallets).toHaveLength(1);
    expect(json.transactions).toHaveLength(1);
  });

  it('POST returns 401 when user is not admin', async () => {
    getAuthContext.mockResolvedValue({ userId: 'u2', role: 'merchant', merchantId: 'm1' });

    const req = buildRequest({ jsonBody: { walletId: 'wallet-1', amount: 100 } });
    const res = await POST(req);

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('POST adjusts wallet balance when admin', async () => {
    getAuthContext.mockResolvedValue({ userId: 'admin1', role: 'admin' });

    const existingWallet = { id: 'wallet-1', balance: 500 };

    // Supabase interactions: select wallet -> update wallet -> insert txn
    __setNextResults(
      { data: existingWallet, error: null },
      { data: null, error: null },
      { data: { id: 'txn-123', wallet_id: 'wallet-1', amount: 200 }, error: null },
    );

    const req = buildRequest({ jsonBody: { walletId: 'wallet-1', amount: 200, reason: 'Manual top-up' } });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.balance).toBe(existingWallet.balance + 200);
    expect(json.transaction.id).toBe('txn-123');
  });
}); 