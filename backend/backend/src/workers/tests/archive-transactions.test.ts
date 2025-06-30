import { createClient } from '@supabase/supabase-js'

jest.mock('@supabase/supabase-js', () => {
  const actual = jest.requireActual('@supabase/supabase-js')
  return {
    ...actual,
    createClient: jest.fn(() => ({
      rpc: jest.fn().mockResolvedValue({ data: 42, error: null })
    }))
  }
})

describe('archive_transactions RPC', () => {
  it('calls archive_transactions with cutoff date', async () => {
    const supabase = createClient('http://localhost', 'anon') as any
    const DAYS = 30
    const cutoffDate = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase.rpc('archive_transactions', { p_cutoff: cutoffDate })
    expect(supabase.rpc).toHaveBeenCalledWith('archive_transactions', { p_cutoff: cutoffDate })
    expect(data).toBe(42)
  })
}) 