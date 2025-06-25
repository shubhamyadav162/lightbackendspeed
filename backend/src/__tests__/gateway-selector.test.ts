import { jest } from '@jest/globals';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockRpc = jest.fn() as any;

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      rpc: mockRpc,
    }),
  } as any;
});

// Import after the mock so it uses the mocked client
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { selectGateway } = require('../lib/gateway-selector');

beforeEach(() => {
  mockRpc.mockReset();
});

describe('Gateway Selection', () => {
  it('should select highest priority active gateway', async () => {
    mockRpc.mockResolvedValue({ data: [{ id: 'gw1', priority: 10 }], error: null });
    const gw = await selectGateway(10000);
    expect(gw).toEqual({ id: 'gw1', priority: 10 });
  });

  it('should return null when no gateway available', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    const gw = await selectGateway(10000);
    expect(gw).toBeNull();
  });

  it('should throw on rpc error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB_ERR' } });
    await expect(selectGateway(5000)).rejects.toThrow('DB_ERR');
  });
}); 