// @ts-nocheck
/* eslint-disable */

/**
 * @jest-environment node
 */

import { GET } from '@/app/api/v1/settlements/route';

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
function buildRequest({ url = 'http://localhost/api/v1/settlements', headers = {} } = {}) {
  return {
    url,
    headers: new Headers(headers),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Settlements API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET returns settlements and logs for merchant', async () => {
    // Mock auth context
    getAuthContext.mockResolvedValue({ userId: 'u1', role: 'merchant', merchantId: 'm1' });

    const settlements = [
      {
        id: 'settle-1',
        merchant_id: 'm1',
        due_amount: 1000,
        status: 'pending',
        updated_at: '2025-06-12T00:00:00Z',
      },
    ];
    const logs = [
      {
        id: 'log-1',
        settlement_id: 'settle-1',
        amount: 1000,
        settled_date: '2025-06-12T01:00:00Z',
      },
    ];

    // First call for settlements, second for logs
    __setNextResults({ data: settlements, error: null }, { data: logs, error: null });

    const req = buildRequest({ url: 'http://localhost/api/v1/settlements?includeLogs=true' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.settlements).toHaveLength(1);
    expect(json.logs).toHaveLength(1);
  });

  it('GET returns admin scoped settlements when merchantId query provided', async () => {
    // Admin user
    getAuthContext.mockResolvedValue({ userId: 'admin1', role: 'admin' });

    const settlements = [
      { id: 'settle-2', merchant_id: 'm2', due_amount: 500, status: 'paid', updated_at: '2025-06-11T00:00:00Z' },
    ];

    // Only one Supabase call expected (no logs included)
    __setNextResults({ data: settlements, error: null });

    const req = buildRequest({ url: 'http://localhost/api/v1/settlements?merchantId=m2' });
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.settlements[0].merchant_id).toBe('m2');
    expect(json.logs).toBeUndefined();
  });
}); 