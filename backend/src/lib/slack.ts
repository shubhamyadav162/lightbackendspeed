export async function sendSlackMessage(message: string, webhookUrl = process.env.SLACK_WEBHOOK_URL) {
  if (!webhookUrl) {
    console.warn("[slack] SLACK_WEBHOOK_URL not configured; skipping message");
    return;
  }
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!res.ok) {
      console.error(`[slack] Failed to send message – status ${res.status}`);
    }
  } catch (err) {
    console.error("[slack] Error sending message", err);
  }
} 