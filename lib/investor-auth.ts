import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual, createDecipheriv } from 'node:crypto';

export const INVESTOR_COOKIE = 'btp_investor';
export const SESSION_SECONDS = 8 * 60 * 60;
export function investorConfig() {
  const key = process.env.BTP_INVESTOR_KEY;
  const hash = process.env.BTP_INVESTOR_PASSWORD_HASH;
  if (!key || !hash || !/^[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)) return null;
  const secret = Buffer.from(key, 'base64');
  if (secret.length !== 32) return null;
  return { secret, hash };
}
export function verifyInvestorPassword(password: string) {
  const config = investorConfig();
  if (!config || password.length > 256 || !password) return false;
  const [salt, expected] = config.hash.split(':');
  const actual = scryptSync(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
function signature(payload: string, secret: Buffer, hash: string) {
  return createHmac('sha256', secret).update(`btp-investor-session-v1:${hash}:${payload}`).digest('base64url');
}
export function createInvestorSession(now = Date.now()) {
  const config = investorConfig();
  if (!config) throw new Error('Investor access is not configured');
  const payload = `${Math.floor(now / 1000) + SESSION_SECONDS}.${randomBytes(16).toString('hex')}`;
  return `${payload}.${signature(payload, config.secret, config.hash)}`;
}
export function validInvestorSession(token?: string, now = Date.now()) {
  const config = investorConfig();
  if (!config || !token || token.length > 200) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^\d{10}$/.test(parts[0]) || !/^[a-f0-9]{32}$/.test(parts[1]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[2])) return false;
  const remaining = Number(parts[0]) - Math.floor(now / 1000);
  if (remaining <= 0 || remaining > SESSION_SECONDS) return false;
  const expected = Buffer.from(signature(`${parts[0]}.${parts[1]}`, config.secret, config.hash));
  const received = Buffer.from(parts[2]);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
export type InvestorBrief = { title: string; intro: string; updated: string; html?: string; sections: Array<{id: string; title: string; paragraphs?: string[]; bullets?: string[]; table?: { headings: string[]; rows: string[][] }; subsections?: Array<{ title: string; body: string }> }> };
export function decryptInvestorBrief(envelope: { iv: string; tag: string; ciphertext: string }): InvestorBrief {
  const config = investorConfig();
  if (!config) throw new Error('Investor access is not configured');
  const key = createHash('sha256').update(config.secret).update('btp-investor-content-v1').digest();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString('utf8'));
}
