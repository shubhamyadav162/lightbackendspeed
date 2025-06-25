// @ts-nocheck
// encryption.ts – Shared utility for Supabase Edge Functions (Deno)
// Uses Web Crypto API to perform AES-256-GCM encryption/decryption compatible
// with Node-side src/lib/encryption.ts implementation.
// Format: iv:authTag:ciphertext   (all hex strings)

const ENCRYPTION_KEY = Deno.env.get("ENCRYPTION_KEY") ?? "";
if (!ENCRYPTION_KEY) {
  console.warn("[encryption] ENCRYPTION_KEY env variable not set – encryption helpers will throw");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex string");
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(): Promise<CryptoKey> {
  if (!ENCRYPTION_KEY) throw new Error("ENCRYPTION_KEY env var missing");
  const keyBytes = hexToBytes(ENCRYPTION_KEY);
  if (keyBytes.length !== 32)
    throw new Error("ENCRYPTION_KEY must be 32-byte (64 hex chars)");
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encrypt(text: string): Promise<string> {
  if (!text) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
  const key = await getKey();
  const encoded = new TextEncoder().encode(text);
  const cipherBuf = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const cipherBytes = new Uint8Array(cipherBuf);
  // Split auth tag from ciphertext (last 16 bytes)
  const authTag = cipherBytes.slice(cipherBytes.length - 16);
  const cipherText = cipherBytes.slice(0, cipherBytes.length - 16);
  return `${bytesToHex(iv)}:${bytesToHex(authTag)}:${bytesToHex(cipherText)}`;
}

export async function decrypt(payload: string): Promise<string> {
  if (!payload) return "";
  const [ivHex, tagHex, cipherHex] = payload.split(":");
  if (!ivHex || !tagHex || !cipherHex) throw new Error("Invalid encrypted payload format");
  const iv = hexToBytes(ivHex);
  const tag = hexToBytes(tagHex);
  const cipher = hexToBytes(cipherHex);
  const combined = new Uint8Array(cipher.length + tag.length);
  combined.set(cipher);
  combined.set(tag, cipher.length);
  const key = await getKey();
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
  return new TextDecoder().decode(plainBuf);
} 