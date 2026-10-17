type Q = { createdAt: Date; userId: string | null; interactions: { createdAt: Date; userId: string | null }[]; outcomes: { id: string }[] };

/** Pure calculation so it can be tested without a database. */
export function engagementMetrics(questions: Q[]) {
  const firstAnswerMinutes: number[] = [];
  const askers = new Set<string>();
  const answerers = new Set<string>();
  let withOutcome = 0;
  for (const q of questions) {
    if (q.userId) askers.add(q.userId);
    if (q.outcomes.length) withOutcome += 1;
    const answers = q.interactions.filter((a) => a.userId !== q.userId);
    for (const a of answers) if (a.userId) answerers.add(a.userId);
    if (answers.length) {
      const first = Math.min(...answers.map((a) => a.createdAt.getTime()));
      firstAnswerMinutes.push(Math.max(0, (first - q.createdAt.getTime()) / 60000));
    }
  }
  const sorted = [...firstAnswerMinutes].sort((a, b) => a - b);
  const median = sorted.length ? (sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2) : null;
  const total = questions.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const both = [...askers].filter((u) => answerers.has(u)).length;
  return {
    questions: total,
    answeredPct: pct(firstAnswerMinutes.length),
    answeredWithin2hPct: pct(firstAnswerMinutes.filter((m) => m <= 120).length),
    medianMinutesToFirstAnswer: median === null ? null : Math.round(median),
    outcomeReportedPct: pct(withOutcome),
    membersWhoAskAndAnswer: both,
  };
}
