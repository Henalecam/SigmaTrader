import { describe, it, expect } from 'vitest';
import { encryptSecret, decryptSecret } from '../src/utils/crypto';

describe('crypto utils', () => {
  it('encrypts and decrypts', () => {
    process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
    const text = 'hello-secret';
    const enc = encryptSecret(text);
    expect(enc).not.toEqual(text);
    const dec = decryptSecret(enc);
    expect(dec).toEqual(text);
  });
});