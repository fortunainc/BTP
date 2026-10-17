/** Broad, verified role label shown instead of identity. */
export function verifiedRoleLabel(role: string | null | undefined): string {
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('crc') || normalized.includes('coordinator') || normalized.includes('site')) return 'Verified site professional';
  if (normalized.includes('cra') || normalized.includes('monitor')) return 'Verified CRA / monitor';
  if (normalized.includes('regulatory') || normalized === 'rm') return 'Verified regulatory professional';
  if (normalized.includes('quality') || normalized === 'qa') return 'Verified quality professional';
  if (normalized.includes('ctm') || normalized.includes('operations') || normalized.includes('project') || normalized === 'pm') return 'Verified clinical operations professional';
  if (normalized.includes('pi') || normalized.includes('investigator')) return 'Verified investigator';
  return 'Verified clinical research professional';
}
