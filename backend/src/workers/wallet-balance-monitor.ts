// @ts-nocheck
import { Worker, Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

// Redis connection based on env
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Supabase service-role client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Queue for sending WhatsApp messages (already used by whatsapp-sender worker)
const whatsappQueue = new Queue('whatsapp-notifications', { connection });

interface WalletDue {
  id: string;
  client_id: string;
  balance_due: number;
  warn_threshold: number;
  wa_last_sent: string | null;
}

async function enqueueLowBalanceNotification(wallet: WalletDue) {
  const { data: client } = await supabase
    .from('clients')
    .select('company_name, webhook_url')
    .eq('id', wallet.client_id)
    .single();

  const template = 'LOW_BALANCE_ALERT';
  const payload = {
    company_name: client?.company_name ?? 'Merchant',
    balance: (wallet.balance_due / 100).toFixed(2),
  };

  await whatsappQueue.add('wa-low-balance', { template, payload }, { attempts: 4 });

  // Update wa_last_sent timestamp to avoid spam (once per 12h)
  await supabase
    .from('commission_wallets')
    .update({ wa_last_sent: new Date().toISOString() })
    .eq('id', wallet.id);
}

export const worker = new Worker(
  'wallet-balance-monitor',
  async () => {
    const { data, error } = await supabase
      .from('commission_wallets')
      .select('*');

    if (error) {
      console.error('[wallet-balance-monitor] failed to fetch wallets', error);
      return;
    }

    // Filter wallets that exceed threshold and not notified recently
    const walletsToNotify = (data as WalletDue[]).filter((wallet) => {
      const exceeds = wallet.balance_due > wallet.warn_threshold;
      const lastSent = wallet.wa_last_sent ? new Date(wallet.wa_last_sent).getTime() : 0;
      const shouldNotify = exceeds && (lastSent === 0 || lastSent < Date.now() - 12 * 60 * 60 * 1000);
      return shouldNotify;
    });

    if (walletsToNotify.length === 0) return;

    console.info(`[wallet-balance-monitor] Found ${walletsToNotify.length} wallets above threshold`);

    for (const wallet of walletsToNotify) {
      try {
        await enqueueLowBalanceNotification(wallet);
      } catch (err) {
        console.error('[wallet-balance-monitor] failed to enqueue WA notification', err);
      }
    }
  },
  { connection, concurrency: 1 },
); 