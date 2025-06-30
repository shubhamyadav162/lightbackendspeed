// Mock pgPool to simulate availability of Postgres pool and capture queries
const mockRows = [
  {
    date: '2025-06-19',
    total_count: 5,
    completed_count: 4,
    failed_count: 1,
    pending_count: 0,
    total_amount: 500,
    completed_amount: 400,
  },
];

const mockQuery = jest.fn().mockResolvedValue({ rows: mockRows });

jest.mock('@/lib/pgPool', () => ({
  getPgPool: () => ({ query: mockQuery }),
}));

// Mock Redis helpers to no-op for unit test
jest.mock('@/lib/redis', () => ({
  getCached: jest.fn().mockResolvedValue(null),
  setCached: jest.fn().mockResolvedValue(undefined),
}));

// Mock Supabase helper to avoid network calls (fallback path should not be hit)
jest.mock('@/lib/supabase/server', () => ({
  supabaseService: {},
  getAuthContext: jest.fn().mockResolvedValue({ merchantId: null }),
}));

/**
 * Mock `next/server` – specifically `NextResponse.json` utility – so that the
 * API route can construct JSON responses during unit tests without bringing in
 * the full Next.js runtime.
 */
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: (body: any, init?: any) => ({
        _body: body,
        _status: init?.status ?? 200,
        json: async () => body,
        status: init?.status ?? 200,
      }),
    },
    NextRequest: class {},
  };
});

import { GET } from '@/app/api/v1/analytics/route';

/** Utility to create a minimal Next.js Request object */
function createRequest(url: string) {
  return new Request(url) as any;
}

describe('GET /api/v1/analytics (raw SQL path)', () => {
  it('executes raw SQL via pgPool when SUPABASE_DB_POOL is configured', async () => {
    const req = createRequest('http://localhost/api/v1/analytics?days=7');

    const res: any = await GET(req);

    // Ensure pgPool.query was invoked
    expect(mockQuery).toHaveBeenCalledTimes(1);

    const json = await res.json();

    expect(json.stats).toEqual(mockRows);
    expect(json.totals.total_count).toBe(5);
    expect(json.totals.completed_amount).toBe(400);
  });
}); 