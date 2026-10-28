import { createHash, createHmac, randomBytes } from 'node:crypto';

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

/** A long random token for the one-click confirmation link. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(`btp-work-email-link-v1:${token}`).digest('hex');
}

/** Keyed one-way hash of a work email, so the same address cannot verify two accounts and the address itself is not kept. */
export function hashEmail(email: string): string {
  const secret = process.env.IDENTITY_HASH_SECRET || process.env.CLERK_SECRET_KEY || '';
  return createHmac('sha256', `btp-identity-v1:${secret}`).update(email).digest('hex');
}
