import { describe, expect, it, vi } from 'vitest';
import { prepareEmailVerification } from '@/lib/sign-in-verification';

describe('password verification continuation', () => {
  for (const status of ['needs_client_trust', 'needs_second_factor']) {
    it(`sends a second-factor email code for ${status}`, async () => {
      const sendEmailCode = vi.fn().mockResolvedValue({ error: null });
      expect(await prepareEmailVerification({ status, supportedSecondFactors: [{ strategy: 'email_code' }], mfa: { sendEmailCode } })).toEqual({ required: true, error: null });
      expect(sendEmailCode).toHaveBeenCalledOnce();
    });
  }
  it('does not challenge a completed sign-in', async () => {
    const sendEmailCode = vi.fn();
    expect(await prepareEmailVerification({ status: 'complete', supportedSecondFactors: [{ strategy: 'email_code' }], mfa: { sendEmailCode } })).toEqual({ required: false, error: null });
    expect(sendEmailCode).not.toHaveBeenCalled();
  });
  it('does not substitute email for an unsupported MFA factor', async () => {
    const sendEmailCode = vi.fn();
    expect((await prepareEmailVerification({ status: 'needs_second_factor', supportedSecondFactors: [{ strategy: 'totp' }], mfa: { sendEmailCode } })).required).toBe(false);
    expect(sendEmailCode).not.toHaveBeenCalled();
  });
  it('keeps verification required after a send failure', async () => {
    const error = { message: 'Too many requests' };
    expect(await prepareEmailVerification({ status: 'needs_client_trust', supportedSecondFactors: [{ strategy: 'email_code' }], mfa: { sendEmailCode: vi.fn().mockResolvedValue({ error }) } })).toEqual({ required: true, error });
  });
});
