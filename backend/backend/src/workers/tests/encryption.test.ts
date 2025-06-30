// @ts-nocheck
// Unit test for Node-side encryption helper (AES-256-GCM)
import { encrypt, decrypt } from "../../lib/encryption";

// Ensure test key (32 bytes = 64 hex chars)
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("Encryption helper", () => {
  it("should encrypt and decrypt symmetrically", () => {
    const plain = "lightspeed-secret";
    const cipher = encrypt(plain);
    expect(cipher).not.toEqual(plain);
    const decrypted = decrypt(cipher);
    expect(decrypted).toEqual(plain);
  });
}); 