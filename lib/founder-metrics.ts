import { prisma } from '@/lib/prisma';
import { REACTIONS } from '@/lib/engagement';
import { trafficSummary } from '@/lib/traffic';

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const QUESTION = { contributionType: { in: ['question', 'situation'] } };
const ANSWER = { interactionType: 'ANSWER' };

/** One-screen view of the business for the founder. Counts only; no member content. */
export async function founderMetrics() {
  const d7 = daysAgo(7), d30 = daysAgo(30);
  const [
    members, verified, pendingVerification, newMembers7, newMembers30,
    questions, questions7, answers, answers7, worked, helpful,
    helpOpen, helpTotal, joinRequests, joinedViaReferral,
    investorsApproved, investorsPending, investorsActive7, traffic,
  ] = await Promise.all([
    prisma.user.count({ where: { isSuspended: false } }),
    prisma.user.count({ where: { verificationStatus: 'Approved', isSuspended: false } }),
    prisma.user.count({ where: { verificationStatus: 'Pending', isSuspended: false } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.contribution.count({ where: QUESTION }),
    prisma.contribution.count({ where: { ...QUESTION, createdAt: { gte: d7 } } }),
    prisma.interaction.count({ where: ANSWER }),
    prisma.interaction.count({ where: { ...ANSWER, createdAt: { gte: d7 } } }),
    prisma.auditLog.count({ where: { action: REACTIONS.WORKED } }),
    prisma.auditLog.count({ where: { action: REACTIONS.HELPFUL } }),
    prisma.privateHelpRequest.count({ where: { status: { notIn: ['COMPLETED', 'CLOSED'] } } }),
    prisma.privateHelpRequest.count(),
    prisma.accessRequest.count(),
    prisma.user.count({ where: { referredById: { not: null } } }),
    prisma.investor.count({ where: { status: 'approved' } }),
    prisma.investor.count({ where: { status: 'pending' } }),
    prisma.investor.count({ where: { lastSeenAt: { gte: d7 } } }),
    trafficSummary(30),
  ]);

  // Last 8 weeks, oldest first, for the trend table.
  const since = daysAgo(56);
  const [u, q, a] = await Promise.all([
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.contribution.findMany({ where: { ...QUESTION, createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.interaction.findMany({ where: { ...ANSWER, createdAt: { gte: since } }, select: { createdAt: true } }),
  ]);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = daysAgo(56 - i * 7), end = daysAgo(49 - i * 7);
    const inWeek = (r: { createdAt: Date }) => r.createdAt >= start && r.createdAt < end;
    return { week: start.toISOString().slice(0, 10), members: u.filter(inWeek).length, questions: q.filter(inWeek).length, answers: a.filter(inWeek).length };
  });

  return {
    generatedAt: new Date().toISOString(),
    members: { total: members, verified, pendingVerification, new7: newMembers7, new30: newMembers30 },
    community: { questions, questions7, answers, answers7, worked, helpful, answersPerQuestion: questions ? Math.round((answers / questions) * 10) / 10 : 0 },
    help: { open: helpOpen, total: helpTotal },
    growth: { joinRequests, joinedViaReferral },
    investors: { approved: investorsApproved, pending: investorsPending, active7: investorsActive7 },
    traffic: traffic.totals,
    weeks,
  };
}
