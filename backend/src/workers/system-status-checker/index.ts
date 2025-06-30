// @ts-nocheck
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Expected env var: SYSTEM_STATUS_COMPONENTS="api:https://api.example.com,frontend:https://app.example.com"
function getComponents() {
  const raw = process.env.SYSTEM_STATUS_COMPONENTS || '';
  return raw.split(',').filter(Boolean).map((pair) => {
    const [name, url] = pair.split(':');
    return { name, url } as { name: string; url: string };
  });
}

async function checkComponent(component: { name: string; url: string }) {
  const start = performance.now();
  try {
    const res = await fetch(component.url, { method: 'GET', timeout: 5000 });
    const duration = Math.round(performance.now() - start);
    const statusTxt = res.status.toString();

    await supabase
      .from('system_status')
      .upsert(
        {
          component: component.name,
          status: statusTxt,
          response_time_ms: duration,
          message: res.statusText,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'component' }
      );
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    await supabase
      .from('system_status')
      .upsert(
        {
          component: component.name,
          status: 'error',
          response_time_ms: duration,
          message: (err as Error).message,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'component' }
      );
  }
}

export default async function runChecks() {
  try {
    await runChecksInternal();
  } catch (err) {
    console.error('[system-status-checker] run failed', err);
    throw err;
  }
}

async function runChecksInternal() {
  const components = getComponents();
  if (components.length === 0) {
    console.warn('[system-status-checker] No components configured');
    return;
  }

  await Promise.all(components.map(checkComponent));
}

// Execute immediately if run standalone
if (require.main === module) {
  runChecks().catch((err) => console.error('system-status-checker failed', err));
} 