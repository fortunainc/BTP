export type MemberAccess = { userRole: string; verificationStatus: string; isSuspended?: boolean };

export function isSuspendedMember(user: MemberAccess): boolean {
  return user.isSuspended === true || user.verificationStatus === 'Suspended';
}

export function isAdminMember(user: MemberAccess): boolean {
  return !isSuspendedMember(user) && ['admin', 'founder'].includes(user.userRole);
}

export function isApprovedMember(user: MemberAccess): boolean {
  return !isSuspendedMember(user) && (user.verificationStatus === 'Approved' || isAdminMember(user));
}
