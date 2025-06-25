// Helper for WhatsApp token management
// This util is shared by workers that need WA API access.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface ProviderAuthResponse {
  token: string;
  expires_in: number; // seconds
}

// Returns a valid provider token, refreshing it if expired or missing.
export async function getWhatsAppToken(forceRefresh = false): Promise<string> {
  const now = new Date();
  if (!forceRefresh) {
    const { data, error } = await supabase
      .from("whatsapp_provider_tokens")
      .select("id, token, expires_at")
      .order("expires_at", { ascending: false })
      .limit(1);

    if (error) throw new Error(`DB_READ: ${error.message}`);

    if (data && data.length && new Date(data[0].expires_at) > new Date(now.getTime() + 30_000)) {
      return data[0].token;
    }
  }

  // No valid token → refresh from provider
  const authRes = await fetch(`${process.env.WA_API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: process.env.WA_API_KEY }),
  });

  if (!authRes.ok) {
    const txt = await authRes.text();
    throw new Error(`WA_AUTH_FAILED: ${authRes.status} ${txt}`);
  }

  const json: ProviderAuthResponse = await authRes.json();
  const expiresAt = new Date(now.getTime() + json.expires_in * 1000);

  // Persist (upsert)
  await supabase.from("whatsapp_provider_tokens").insert({
    token: json.token,
    expires_at: expiresAt.toISOString(),
  });

  return json.token;
} 