import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

const PERSONAL_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com',
  'icloud.com', 'me.com', 'mac.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'mail.com', 'yandex.com', 'zoho.com']);

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/.test(email) && email.length <= 254 ? email : null;
}

export function isWorkEmail(email: string): boolean {
  return !PERSONAL_DOMAINS.has(email.split('@')[1] ?? '');
}

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashCode(userId: string, code: string): string {
  return createHash('sha256').update(`btp-work-email-v1:${userId}:${code}`).digest('hex');
}

export function codeMatches(userId: string, code: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(userId, code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
