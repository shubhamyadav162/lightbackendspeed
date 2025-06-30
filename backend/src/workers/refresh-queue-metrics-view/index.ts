import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false },
})

const VIEW_NAME = 'vw_queue_metrics_hourly'

async function main() {
  const { error } = await supabase.rpc('refresh_materialized_view', {
    p_view_name: VIEW_NAME,
  })
  if (error) {
    console.error(`[refresh-queue-metrics-view] Error refreshing ${VIEW_NAME}`, error)
    process.exit(1)
  }
  console.log(`[refresh-queue-metrics-view] Refreshed ${VIEW_NAME}`)
}

main().catch((err) => {
  console.error('[refresh-queue-metrics-view] Fatal', err)
  process.exit(1)
}) 