import { encrypt, decrypt } from './encryption';

// Helper – check if string पहले से cipher pattern में है (iv:tag:cipher)
function isCipher(text: string): boolean {
  return typeof text === 'string' && text.split(':').length === 3;
}

export function maybeDecrypt(text?: string): string | undefined {
  if (!text) return text;
  try {
    if (isCipher(text)) {
      return decrypt(text);
    }
  } catch {
    // Not a valid cipher or decryption failed – treat as plain text
  }
  return text;
}

/**
 * Recursively encrypt all string fields inside an object (idempotent).
 */
export function encryptSensitiveFields<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (typeof v === 'string') {
      out[k] = isCipher(v) ? v : encrypt(v);
    } else if (v && typeof v === 'object') {
      out[k] = encryptSensitiveFields(v as any);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/**
 * Recursively decrypt all string fields inside an object; silently skips plain strings.
 */
export function decryptSensitiveFields<T extends Record<string, any>>(obj: T): T {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (typeof v === 'string') {
      out[k] = maybeDecrypt(v);
    } else if (v && typeof v === 'object') {
      out[k] = decryptSensitiveFields(v as any);
    } else {
      out[k] = v;
    }
  }
  return out as T;
} 