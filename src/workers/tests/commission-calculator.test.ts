import { jest } from '@jest/globals';

// Mock Supabase client so we can intercept rpc calls
jest.mock('@supabase/supabase-js', () => {
  return {
    createClient: jest.fn(() => ({
      rpc: jest.fn(async () => ({ data: null, error: null })),
    })),
  };
});

import { calculateCommission } from '../../lib/commission-calculator';
import { createClient } from '@supabase/supabase-js';

describe('Commission Calculation', () => {
  it('should calculate commission and invoke process_commission RPC', async () => {
    const txnId = 'txn-123';
    const amount = 10000; // paisa (₹100)
    const feePercent = 3.5;

    await calculateCommission(txnId, amount, feePercent);

    // @ts-ignore – jest mock returns unknown
    const mockRpc = (createClient as jest.Mock).mock.results[0].value.rpc;

    expect(mockRpc).toHaveBeenCalledWith('process_commission', {
      p_transaction_id: txnId,
      p_commission: 350, // 3.5% of 10000 paisa
    });
  });
}); 