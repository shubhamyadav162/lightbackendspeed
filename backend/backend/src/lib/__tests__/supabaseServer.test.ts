// Mock Supabase client BEFORE server helper is imported, so import uses the stub.
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    })),
  };
});

import { getAuthContext, supabaseService } from '@/lib/supabase/server';

// Utility helper to create a minimal NextRequest-like object
function mockRequest(headers: Record<string, string | undefined>): any {
  return {
    headers: new Headers(headers as Record<string, string>),
  };
}

describe('getAuthContext', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns null when no auth token provided', async () => {
    const req = mockRequest({});

    const result = await getAuthContext(req as any);
    expect(result).toBeNull();
  });

  it('returns auth context when token & metadata present', async () => {
    // Mock supabaseService.auth.getUser
    jest
      .spyOn(supabaseService.auth, 'getUser')
      .mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      } as any);

    // Prepare chain mocks for supabaseService.from('users')...
    const singleMock = jest.fn().mockResolvedValue({
      data: { role: 'merchant', merchant_id: 'm1' },
      error: null,
    });

    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    jest.spyOn(supabaseService as any, 'from').mockReturnValue({ select: selectMock } as any);

    const req = mockRequest({ authorization: 'Bearer faketoken' });

    const ctx = await getAuthContext(req as any);

    expect((supabaseService.auth.getUser as jest.Mock)).toHaveBeenCalledWith('faketoken');
    expect(ctx).toEqual({ userId: 'user123', role: 'merchant', merchantId: 'm1' });
  });

  it('extracts token from sb-access-token cookie', async () => {
    // Mock supabase service auth & metadata responses
    jest
      .spyOn(supabaseService.auth, 'getUser')
      .mockResolvedValue({
        data: { user: { id: 'cookieUser' } },
        error: null,
      } as any);

    const singleMock = jest.fn().mockResolvedValue({
      data: { role: 'admin', merchant_id: null },
      error: null,
    });

    const eqMock = jest.fn().mockReturnValue({ single: singleMock });
    const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
    jest.spyOn(supabaseService as any, 'from').mockReturnValue({ select: selectMock } as any);

    const cookieToken = encodeURIComponent('cookietoken');
    const req = mockRequest({ cookie: `sb-access-token=${cookieToken}` });

    const ctx = await getAuthContext(req as any);

    expect(ctx).toEqual({ userId: 'cookieUser', role: 'admin' });
  });

  it('returns null when Supabase auth fails', async () => {
    jest
      .spyOn(supabaseService.auth, 'getUser')
      .mockResolvedValue({
        data: { user: null },
        error: { message: 'invalid' },
      } as any);

    const req = mockRequest({ authorization: 'Bearer bad' });

    const ctx = await getAuthContext(req as any);

    expect(ctx).toBeNull();
  });
}); 