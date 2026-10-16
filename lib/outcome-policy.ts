// Usefulness labels are independent from the value of contributing feedback.
export const OUTCOME_POLICY = {
  resolution: { impactScore: 1, wasHelpful: true },
  validation: { impactScore: 0.8, wasHelpful: true },
  correction: { impactScore: 0, wasHelpful: false },
  incomplete: { impactScore: 0, wasHelpful: false },
  misleading: { impactScore: -0.5, wasHelpful: false },
} as const;
export function isOutcomeType(value: unknown): value is keyof typeof OUTCOME_POLICY {
  return typeof value === 'string' && Object.hasOwn(OUTCOME_POLICY, value);
}
