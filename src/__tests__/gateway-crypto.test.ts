import { encryptSensitiveFields, decryptSensitiveFields } from '../lib/gateway-crypto';

describe('Gateway Credentials Encryption', () => {
  it('should encrypt then decrypt back to original object', () => {
    const original = {
      api_key: 'test123',
      nested: {
        api_secret: 'secret456'
      }
    };

    const enc = encryptSensitiveFields(original);
    expect(enc.api_key).not.toBe(original.api_key);

    const dec = decryptSensitiveFields(enc);
    expect(dec).toEqual(original);
  });
}); 