import { verifiedRoleLabel } from '@/lib/role-label';
import { TEAM_HANDLE } from '@/lib/team-account';

/**
 * The only author fields any member view may select. Never add name, email,
 * employer, verification evidence or the user id here.
 */
export const PUBLIC_AUTHOR_SELECT = {
  handle: true,
  roleCategory: true,
  verificationStatus: true,
  isSuspended: true,
} as const;

export type PublicAuthorSource = {
  handle: string | null;
  roleCategory: string | null;
  verificationStatus: string | null;
  isSuspended: boolean | null;
} | null | undefined;

/** Same rule the answer list already used: approved members get their generalized verified role. */
export function authorRoleLabel(author: PublicAuthorSource): string {
  if (author?.handle === TEAM_HANDLE) return 'BTP team';
  return author?.verificationStatus === 'Approved' ? verifiedRoleLabel(author.roleCategory) : 'BTP member';
}

/** Public handle only for approved, unsuspended members; otherwise null. */
export function authorHandle(author: PublicAuthorSource): string | null {
  if (!author || author.verificationStatus !== 'Approved' || author.isSuspended) return null;
  return author.handle || null;
}

export function publicAuthor(author: PublicAuthorSource): { authorHandle: string | null; authorRole: string } {
  return { authorHandle: authorHandle(author), authorRole: authorRoleLabel(author) };
}
