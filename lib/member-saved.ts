import { prisma } from '@/lib/prisma';
import { REACTIONS } from '@/lib/engagement';
import { PUBLIC_AUTHOR_SELECT, publicAuthor } from '@/lib/public-author';

export type SavedAnswerItem = {
  answerId: string;
  situationId: string;
  situationTitle: string;
  excerpt: string;
  authorHandle: string | null;
  authorRole: string;
  savedAt: string;
};

const EXCERPT_LENGTH = 200;

export function excerptOf(text: string | null | undefined): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > EXCERPT_LENGTH ? `${clean.slice(0, EXCERPT_LENGTH).trimEnd()}…` : clean;
}

/**
 * The member's SAVED answers, newest save first. Answers that are no longer
 * visible, or whose question is hidden, flagged or excluded, are left out.
 */
export async function savedAnswersFor(userId: string, limit = 100): Promise<SavedAnswerItem[]> {
  const saves = await prisma.auditLog.findMany({
    where: { userId, action: REACTIONS.SAVED, resourceType: 'Interaction', resourceId: { not: null } },
    select: { resourceId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: limit * 2,
  });
  // One entry per answer even if a concurrent request wrote twice.
  const savedAt = new Map<string, Date>();
  for (const s of saves) if (s.resourceId && !savedAt.has(s.resourceId)) savedAt.set(s.resourceId, s.createdAt);
  if (savedAt.size === 0) return [];

  const answers = await prisma.interaction.findMany({
    where: {
      id: { in: [...savedAt.keys()] },
      interactionType: 'ANSWER',
      displayStatus: 'VISIBLE',
      context: { not: null },
      contribution: {
        contributionType: { in: ['question', 'situation'] },
        isHidden: false, isFlagged: false, forceExcludeFromPatterns: false,
      },
    },
    select: {
      id: true,
      context: true,
      contributionId: true,
      contribution: { select: { title: true } },
      user: { select: PUBLIC_AUTHOR_SELECT },
    },
  });

  type SavedRow = { id: string; context: string | null; contributionId: string; contribution: { title: string }; user: Parameters<typeof publicAuthor>[0] };
  return (answers as SavedRow[])
    .filter((a) => (a.context || '').trim().length > 0)
    .map((a): SavedAnswerItem => ({
      answerId: a.id,
      situationId: a.contributionId,
      situationTitle: a.contribution.title,
      excerpt: excerptOf(a.context),
      ...publicAuthor(a.user),
      savedAt: savedAt.get(a.id)!.toISOString(),
    }))
    .sort((x, y) => y.savedAt.localeCompare(x.savedAt))
    .slice(0, limit);
}
