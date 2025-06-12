// @ts-nocheck
// WhatsApp Sender Worker (Phase 1 Task 3)
// Consumes 'whatsapp-notifications' queue and sends WA messages.

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";
import { getWhatsAppToken } from "../../lib/wa-token";

const connection = { url: process.env.REDIS_URL! };
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendWhatsApp(template: string, payload: unknown, token: string) {
  const url = `${process.env.WA_API_URL}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ template, payload }),
  });

  return res;
}

export const worker = new Worker(
  "whatsapp-notifications",
  async (job) => {
    const { template, payload } = job.data;

    let token = await getWhatsAppToken();
    let res = await sendWhatsApp(template, payload, token);

    // If unauthorized, refresh token & retry once
    if (res.status === 401) {
      console.info("[whatsapp-sender] refreshing WA token and retrying");
      token = await getWhatsAppToken(true); // force token refresh
      res = await sendWhatsApp(template, payload, token);
    }

    const ok = res.ok;
    const errorText = ok ? null : await res.text();

    await supabase
      .from("whatsapp_notifications")
      .update({
        status: ok ? "sent" : "failed",
        sent_at: new Date(),
        error: errorText,
      })
      .eq("id", job.id as unknown as string);
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_WHATSAPP) || 30, attempts: 4 }
); 