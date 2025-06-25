import { jest } from '@jest/globals';

jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    })),
  };
});

import { calculateCommission } from '../commission-calculator';
import { createClient } from '@supabase/supabase-js';

describe('calculateCommission', () => {
  it('calls process_commission with correct params', async () => {
    const mockRpc = (createClient as jest.Mock).mock.results[0].value.rpc;

    await calculateCommission('txn-123', 10000, 3.5);

    expect(mockRpc).toHaveBeenCalledWith('process_commission', {
      p_transaction_id: 'txn-123',
      p_commission: 350,
    });
  });
}); 