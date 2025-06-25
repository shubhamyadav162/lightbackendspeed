import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext, supabaseService } from '@/lib/supabase/server';

// Singleton service-role Supabase client
const supabase = supabaseService;

/**
 * Legacy header auth fallback used by existing merchant SDK integrations.
 * Returns merchant row if credentials are valid; otherwise throws.
 */
async function verifyMerchantAuth(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const apiSecret = request.headers.get('x-api-secret');

  if (!apiKey || !apiSecret) return null;

  const { data, error } = await supabase
    .from('merchants')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  if (error || !data || data.api_salt !== apiSecret) {
    throw new Error('Invalid API credentials');
  }

  return data;
}

/**
 * GET /api/v1/wallets
 *
 * Query params:
 *   merchantId          – override merchant scope (admin only)
 *   includeTransactions – if "true" also returns wallet_transactions rows (max 100)
 *   limit               – max number of transaction rows to return (default 20, capped at 100)
 *
 * Response:
 *   {
 *     wallets: CustomerWallet[],
 *     transactions?: WalletTransaction[]
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Supabase Auth (preferred)
    const authCtx = await getAuthContext(request);

    // 2. Fallback legacy header auth
    let legacyMerchantId: string | null = null;
    if (!authCtx?.merchantId) {
      try {
        const merchant = await verifyMerchantAuth(request);
        if (merchant) legacyMerchantId = merchant.id;
      } catch (authErr: any) {
        // If credentials were supplied but invalid, return 401
        if (request.headers.has('x-api-key') || request.headers.has('x-api-secret')) {
          return NextResponse.json({ error: authErr.message }, { status: 401 });
        }
      }
    }

    // Determine merchant scope
    let merchantId: string | null = authCtx?.merchantId || legacyMerchantId;

    // Query params (admin override)
    const { searchParams } = new URL(request.url);
    const qpMerchantId = searchParams.get('merchantId');
    const includeTxns = searchParams.get('includeTransactions') === 'true';
    const limitParam = parseInt(searchParams.get('limit') || '20', 10);
    const limit = isNaN(limitParam) ? 20 : Math.min(limitParam, 100);
    if (qpMerchantId) merchantId = qpMerchantId;

    // --- Fetch wallets ---
    let walletsQuery = supabase
      .from('customer_wallets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (merchantId) walletsQuery = walletsQuery.eq('merchant_id', merchantId);

    const { data: wallets, error: walletErr } = await walletsQuery;
    if (walletErr) throw new Error(walletErr.message);

    // --- Optionally fetch recent transactions ---
    let transactions: any[] | null = null;
    if (includeTxns && wallets && wallets.length) {
      const walletIds = wallets.map((w) => w.id);
      const { data: txnRows, error: txnErr } = await supabase
        .from('wallet_transactions')
        .select('*')
        .in('wallet_id', walletIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (txnErr) throw new Error(txnErr.message);
      transactions = txnRows || [];
    }

    return NextResponse.json({ wallets, transactions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admin users can adjust wallet balances
    const authCtx = await getAuthContext(request);
    if (!authCtx || authCtx.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      walletId,
      amount,
      type = amount >= 0 ? 'credit' : 'debit',
      reason = null,
      reference = null,
    } = body || {};

    if (!walletId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'walletId and numeric amount are required' }, { status: 400 });
    }

    // Fetch existing wallet
    const { data: wallet, error: walletErr } = await supabase
      .from('customer_wallets')
      .select('*')
      .eq('id', walletId)
      .single();

    if (walletErr || !wallet) {
      throw new Error(walletErr?.message || 'Wallet not found');
    }

    const newBalance = (wallet.balance || 0) + amount;

    // Update wallet balance
    const { error: updateErr } = await supabase
      .from('customer_wallets')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('id', walletId);

    if (updateErr) throw new Error(updateErr.message);

    // Insert wallet transaction record
    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .insert({
        wallet_id: walletId,
        type,
        amount,
        reason,
        reference,
        created_at: new Date().toISOString(),
      })
      .select('*')
      .single();

    if (txnErr) throw new Error(txnErr.message);

    return NextResponse.json({ walletId, balance: newBalance, transaction: txn });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
} 