type VerificationError = { message?: string; longMessage?: string };
type SignInVerification = {
  status: string | null;
  supportedSecondFactors: Array<{ strategy: string }> | null;
  mfa: { sendEmailCode: () => Promise<{ error: VerificationError | null }> };
};

// Password/device-trust codes must use the second-factor API. Starting another
// sign-in would discard the password verification already completed.
export async function prepareEmailVerification(signIn: SignInVerification) {
  if (signIn.status !== 'needs_client_trust' && signIn.status !== 'needs_second_factor') return { required: false, error: null };
  if (!signIn.supportedSecondFactors?.some(factor => factor.strategy === 'email_code')) return { required: false, error: null };
  const { error } = await signIn.mfa.sendEmailCode();
  return { required: true, error };
}
