/**
 * @jest-environment node
 */

import { GET, POST } from '@/app/api/v1/wallets/route';
import { Headers } from 'node-fetch';

// --- Mock supabase server utilities ---
jest.mock('@/lib/supabase/server', () => {
  const createBuilder = (result: any) => {
    const promise = Promise.resolve(result);

    // Object that is chainable and thenable (await-able)
    const builder: any = {
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

  const mockFrom = jest.fn();

  // Expose helpers to configure per-test behaviour
  const __setNextResults = (...results: any[]) => {
    mockFrom.mockReset();
    results.forEach((res) => {
      mockFrom.mockImplementationOnce(() => createBuilder(res));
    });
  };

  return {
    // Supabase service client stub
    supabaseService: {
      from: mockFrom,
    },
    // Auth context helper will be overridden in tests
    getAuthContext: jest.fn(),
    __setNextResults,
  };
});

// Re-import the mocked module types
import {
  getAuthContext,
  supabaseService,
  __setNextResults,
} from '@/lib/supabase/server' as any;

// Helper to build minimal request objects the route expects
function buildRequest({
  url = 'http://localhost/api/v1/wallets',
  headers = {},
  jsonBody,
}: {
  url?: string;
  headers?: Record<string, string>;
  jsonBody?: any;
}) {
  return {
    url,
    headers: new Headers(headers),
    json: jsonBody ? async () => jsonBody : undefined,
  } as any;
}

describe('API Route /api/v1/wallets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns wallets & transactions for merchant', async () => {
    // Arrange auth context for merchant
    (getAuthContext as jest.Mock).mockResolvedValue({
      userId: 'u1',
      role: 'merchant',
      merchantId: 'm1',
    });

    const wallets = [
      {
        id: 'wallet-1',
        merchant_id: 'm1',
        balance: 1000,
        updated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
    ];
    const transactions = [
      {
        id: 'txn-1',
        wallet_id: 'wallet-1',
        amount: 100,
        type: 'credit',
        created_at: new Date().toISOString(),
      },
    ];

    // Configure Supabase mock responses (order matters)
    // 1) customer_wallets query
    // 2) wallet_transactions query
    (__setNextResults as any)(
      { data: wallets, error: null },
      { data: transactions, error: null }
    );

    const req = buildRequest({
      url: 'http://localhost/api/v1/wallets?includeTransactions=true',
      headers: {},
    });

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.wallets).toHaveLength(1);
    expect(json.transactions).toHaveLength(1);
    expect(json.wallets[0].merchant_id).toBe('m1');
  });

  it('POST returns 401 when user is not admin', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      userId: 'u2',
      role: 'merchant',
      merchantId: 'm1',
    });

    const req = buildRequest({
      jsonBody: { walletId: 'wallet-1', amount: 100 },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toMatch(/unauthorized/i);
  });

  it('POST adjusts wallet balance when admin', async () => {
    (getAuthContext as jest.Mock).mockResolvedValue({
      userId: 'admin1',
      role: 'admin',
    });

    const existingWallet = {
      id: 'wallet-1',
      balance: 500,
      merchant_id: 'm1',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const updatedBalance = existingWallet.balance + 200;

    // Configure sequence:
    // 1) Fetch wallet (select ... single)
    // 2) Update wallet balance (update ... eq)
    // 3) Insert wallet_transactions (insert ... select ... single)
    (__setNextResults as any)(
      { data: existingWallet, error: null }, // select wallet
      { data: null, error: null }, // update wallet
      { data: { id: 'txn-123', wallet_id: 'wallet-1', amount: 200 }, error: null } // insert txn
    );

    const req = buildRequest({
      jsonBody: { walletId: 'wallet-1', amount: 200, reason: 'Manual top-up' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.balance).toBe(updatedBalance);
    expect(json.transaction.id).toBe('txn-123');
  });
}); 