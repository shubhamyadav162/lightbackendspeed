import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ARCHIVE_CUTOFF_DAYS = Number(process.env.ARCHIVE_CUTOFF_DAYS ?? 730)

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('[archive-transactions] Missing Supabase env variables')
  process.exit(1)
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const cutoffDate = new Date(Date.now() - ARCHIVE_CUTOFF_DAYS * 24 * 60 * 60 * 1000).toISOString()

  console.log(`[archive-transactions] Archiving transactions older than ${cutoffDate}`)

  const { data, error } = await supabase.rpc('archive_transactions', { p_cutoff: cutoffDate })
  if (error) {
    console.error('[archive-transactions] RPC error', error)
    process.exit(1)
  }

  console.log(`[archive-transactions] Archived ${data} transactions (cutoff ${cutoffDate})`)
}

main().catch((e) => {
  console.error('[archive-transactions] Fatal error', e)
  process.exit(1)
}) 