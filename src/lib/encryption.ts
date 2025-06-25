import crypto from 'crypto';

// Node-side AES-256-GCM helper used by workers & tests.
// Format matches Edge version → iv:authTag:ciphertext (hex strings)

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const IV_LEN = 12; // 96-bit IV per AES-GCM best practice
const TAG_LEN = 16; // 128-bit auth tag (GCM default)

function assertKey() {
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY env var missing');
  }
  if (ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 32-byte hex string');
  }
}

export function encrypt(plain: string): string {
  assertKey();
  if (!plain) return '';
  const iv = crypto.randomBytes(IV_LEN);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

export function decrypt(payload: string): string {
  assertKey();
  if (!payload) return '';
  const [ivHex, tagHex, encHex] = payload.split(':');
  if (!ivHex || !tagHex || !encHex) throw new Error('Invalid encrypted payload');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
} 