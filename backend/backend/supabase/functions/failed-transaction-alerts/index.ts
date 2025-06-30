// @ts-nocheck
// deno-lint-ignore-file
// Edge Function: failed-transaction-alerts
// Triggered via HTTP / Database trigger. Posts Slack alert, optional SendGrid email, and persists row in alerts table.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables provided via Supabase dashboard secrets
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLACK_WEBHOOK_URL = Deno.env.get("SLACK_WEBHOOK_URL") ?? "";
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY") ?? "";
const SENDGRID_TO = Deno.env.get("SENDGRID_TO") ?? "";
const SENDGRID_FROM = Deno.env.get("SENDGRID_FROM") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TxnPayload {
  id: string;
  txn_id: string;
  merchant_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

async function postToSlack(message: string) {
  if (!SLACK_WEBHOOK_URL) return;
  await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}

async function sendEmail(message: string) {
  if (!SENDGRID_API_KEY || !SENDGRID_TO || !SENDGRID_FROM) return;
  await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: SENDGRID_TO }],
          subject: "⚠️ Failed Transaction Alert",
        },
      ],
      from: { email: SENDGRID_FROM },
      content: [
        {
          type: "text/plain",
          value: message,
        },
      ],
    }),
  });
}

async function persistAlert(txn: TxnPayload, message: string) {
  await supabase.from("alerts").insert({
    transaction_id: txn.id,
    message,
  });
}

function buildMessage(txn: TxnPayload): string {
  return `⚠️ Transaction *${txn.txn_id}* for merchant *${txn.merchant_id}* failed. Amount: ${txn.amount} ${txn.currency}.`;
}

export { buildMessage };

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let payload: TxnPayload;
  try {
    payload = await req.json();
  } catch (_) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const message = buildMessage(payload);

  // Fire & forget – don't await to reduce latency
  postToSlack(message);
  sendEmail(message);
  persistAlert(payload, message);

  return new Response("OK", { status: 200 });
}); 