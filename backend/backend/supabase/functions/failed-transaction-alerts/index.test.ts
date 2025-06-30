// @ts-nocheck

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildMessage } from "./index.ts";

Deno.test("buildMessage returns formatted alert", () => {
  const sampleTxn = {
    id: "uuid-123",
    txn_id: "TXN_987654",
    merchant_id: "MERCHANT_42",
    amount: 1999,
    currency: "INR",
    status: "FAILED",
    created_at: new Date().toISOString(),
  };

  const expected =
    `⚠️ Transaction *TXN_987654* for merchant *MERCHANT_42* failed. Amount: 1999 INR.`;

  const actual = buildMessage(sampleTxn as any);
  assertEquals(actual, expected);
}); 