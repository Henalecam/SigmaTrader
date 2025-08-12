import crypto from 'crypto';
import { env } from '../config/env';

const ENC_ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const keyRaw = env.ENCRYPTION_KEY;
  // Accept hex or base64, or raw string padded
  if (/^[0-9a-fA-F]{64}$/.test(keyRaw)) {
    return Buffer.from(keyRaw, 'hex');
  }
  const buf = Buffer.from(keyRaw, 'base64');
  if (buf.length === 32) return buf;
  const utf8 = Buffer.from(keyRaw, 'utf8');
  if (utf8.length >= 32) return utf8.subarray(0, 32);
  return Buffer.concat([utf8, Buffer.alloc(32 - utf8.length)]);
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const key = getKey();
  const cipher = crypto.createCipheriv(ENC_ALGO, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join('.');
}

export function decryptSecret(blob: string): string {
  const [ivB64, tagB64, dataB64] = blob.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv(ENC_ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(data), decipher.final()]);
  return plaintext.toString('utf8');
}