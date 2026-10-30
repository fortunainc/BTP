/**
 * Filters for GET /api/situations. Kept out of the route file so they can be
 * unit tested (route modules may only export HTTP handlers).
 */

/** Accepted issueCategory filter values (matched case-insensitively). */
export const ISSUE_CATEGORIES = [
  'Enrollment',
  'Protocol burden',
  'Sponsor expectations',
  'Data integrity',
  'Regulatory',
  'Operational',
  'Staffing',
  'Site Overload',
  'Patient Retention',
  'Budget/Reimbursement',
  'Other',
] as const;

/**
 * Returns a Prisma condition for the category, or null if the value is not an
 * accepted category. Stored values come from this list or from the
 * auto-structuring labels (e.g. 'Protocol Burden'), hence case-insensitive.
 */
export function issueCategoryWhere(value: string | null | undefined) {
  if (!value) return null;
  const match = ISSUE_CATEGORIES.find((c) => c.toLowerCase() === value.trim().toLowerCase());
  return match ? { equals: match, mode: 'insensitive' as const } : null;
}

export function isUnansweredParam(value: string | null | undefined): boolean {
  return ['1', 'true'].includes((value || '').trim().toLowerCase());
}

/** Same rule as hasVisibleAnswer: no ANSWER interaction with displayStatus VISIBLE. */
export const UNANSWERED_WHERE = { none: { interactionType: 'ANSWER', displayStatus: 'VISIBLE' } } as const;
