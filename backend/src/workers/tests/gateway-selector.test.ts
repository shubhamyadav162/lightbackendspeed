import { jest } from '@jest/globals';

// Mock Supabase client rpc implementation
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      rpc: jest.fn(async (_fn: string, _args: any) => {
        // Simulate DB returning ordered gateways (already selected by SQL)
        return {
          data: [
            { id: 'gw-high', name: 'razorpay_1', priority: 10 },
            { id: 'gw-low', name: 'razorpay_2', priority: 1 },
          ],
          error: null,
        };
      }),
    })),
  };
});

import { selectGateway } from '../../lib/gateway-selector';
import { createClient } from '@supabase/supabase-js';

describe('Gateway Selection', () => {
  it('should return the first gateway from RPC result set', async () => {
    const gw = await selectGateway(5000);
    expect(gw).toEqual({ id: 'gw-high', name: 'razorpay_1', priority: 10 });
  });

  it('should call rpc with correct argument amount', async () => {
    // @ts-ignore – jest mock returns unknown
    const mockRpc = (createClient as jest.Mock).mock.results[0].value.rpc;
    await selectGateway(7500);
    expect(mockRpc).toHaveBeenCalledWith('select_gateway_for_amount', {
      p_amount: 7500,
    });
  });
}); 