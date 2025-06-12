// @ts-nocheck
// WhatsApp Sender Worker (Phase 1 Task 3)
// Consumes 'whatsapp-notifications' queue and sends WA messages.

import { Worker } from "bullmq";
import { createClient } from "@supabase/supabase-js";

const connection = { url: process.env.REDIS_URL! };
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function sendWhatsApp(template: string, payload: unknown) {
  const url = `${process.env.WA_API_URL}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WA_API_KEY}`,
    },
    body: JSON.stringify({ template, payload }),
  });

  if (res.status === 401) {
    console.warn("[whatsapp-sender] Token expired – TODO refresh token");
    return { success: false, error: "UNAUTHORIZED" };
  }

  if (!res.ok) {
    const errText = await res.text();
    return { success: false, error: errText };
  }

  return { success: true };
}

export const worker = new Worker(
  "whatsapp-notifications",
  async (job) => {
    const { client_id, template, payload } = job.data;

    const result = await sendWhatsApp(template, payload);

    // Update DB row (set error if any)
    await supabase
      .from("whatsapp_notifications")
      .update({
        status: result.success ? "sent" : "failed",
        sent_at: new Date(),
        error: result.error ?? null,
      })
      .eq("id", job.id as unknown as string);
  },
  { connection, concurrency: Number(process.env.MAX_CONCURRENCY_WHATSAPP) || 30, attempts: 4 }
); 