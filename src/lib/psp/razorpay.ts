// No Node-specific imports needed – use built-in fetch & Buffer APIs

interface RazorpayPayoutOptions {
  amountPaise: number;
  currency?: string;
  purpose?: string;
  mode?: string;
  notes?: Record<string, string>;
  queueIfLowBalance?: boolean;
}

/**
 * Creates a payout using Razorpay Payouts API.
 * Requires `RAZORPAY_PAYOUT_KEY_ID` and `RAZORPAY_PAYOUT_KEY_SECRET` env vars.
 * Docs: https://razorpay.com/docs/api/payouts/
 */
export async function createPayout(
  opts: RazorpayPayoutOptions,
): Promise<{ id: string; status: string }> {
  const {
    amountPaise,
    currency = "INR",
    purpose = "payout",
    mode = "IMPS",
    notes = {},
    queueIfLowBalance = true,
  } = opts;

  const keyId = process.env.RAZORPAY_PAYOUT_KEY_ID;
  const keySecret = process.env.RAZORPAY_PAYOUT_KEY_SECRET;
  const accountNumber = process.env.RAZORPAY_PAYOUT_ACCOUNT_NUMBER; // Beneficiary account linked under payout settings

  if (!keyId || !keySecret || !accountNumber) {
    throw new Error("RAZORPAY_PAYOUT_ENV_NOT_SET");
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  // NOTE: Real-world flow requires creating a contact & fund account for destination before payout.
  // For aggregator self-payout to merchant account_number, we assume the payout account is pre-configured.
  // If RAZORPAY_TEST_MODE is set, Razorpay will auto-mock the payout.

  const body = {
    account_number: accountNumber,
    amount: amountPaise,
    currency,
    mode,
    purpose,
    queue_if_low_balance: queueIfLowBalance,
    notes,
  };

  const res = await fetch("https://api.razorpay.com/v1/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`RAZORPAY_PAYOUT_FAILED_${errText}`);
  }

  const json = (await res.json()) as { id: string; status: string };
  return json;
} 