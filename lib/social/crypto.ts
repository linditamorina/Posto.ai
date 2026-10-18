import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';

// Çelësi 32-bajtësh (base64) nga SOCIAL_TOKEN_KEY - gjeneroni me: openssl rand -base64 32
function getKey(): Buffer {
  const raw = process.env.SOCIAL_TOKEN_KEY;
  if (!raw) throw new Error('SOCIAL_TOKEN_KEY mungon.');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('SOCIAL_TOKEN_KEY duhet të jetë 32 bajt në base64.');
  return key;
}

// Enkriptim AES-256-GCM: iv.tag.ciphertext (base64url)
export function encryptToken(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64url')).join('.');
}

export function decryptToken(enc: string): string {
  const [iv, tag, data] = enc.split('.').map(p => Buffer.from(p, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

function hmac(payload: string): string {
  return createHmac('sha256', getKey()).update(payload).digest('base64url');
}

// State-i i OAuth: i nënshkruar që askush të mos e falsifikojë
export function signState(data: object): string {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${payload}.${hmac(payload)}`;
}

export function verifyState<T>(state: string): T | null {
  const [payload, sig] = state.split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(hmac(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}
