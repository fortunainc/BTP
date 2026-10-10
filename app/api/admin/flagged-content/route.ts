import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminAccess } from '@/lib/admin-auth';

export async function GET(req: NextRequest) {
  const adminAuth = await verifyAdminAccess(req);

  if (!adminAuth.success) {
    return NextResponse.json(
      { error: adminAuth.error },
      { status: adminAuth.statusCode || 403 }
    );
  }

  try {
    const flaggedContent = await prisma.flaggedContent.findMany({
      where: {
        contentType: { in: ['Contribution', 'Interaction', 'Message'] },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hydrated = await Promise.all(flaggedContent.map(async flag => {
      if (flag.contentType === 'Contribution') {
        const content = await prisma.contribution.findUnique({
          where: { id: flag.contentId },
          select: { title: true, description: true, isHidden: true },
        });
        return {
          ...flag,
          contentState: content ? (content.isHidden ? 'HIDDEN' : 'VISIBLE') : 'MISSING',
          contentPreview: content ? `${content.title}\n${content.description}`.slice(0, 500) : null,
        };
      }

      if (flag.contentType === 'Interaction') {
        const content = await prisma.interaction.findUnique({
          where: { id: flag.contentId },
          select: { context: true, displayStatus: true },
        });
        return {
          ...flag,
          contentState: content?.displayStatus || 'MISSING',
          contentPreview: content?.context?.slice(0, 500) || null,
        };
      }

      const content = await prisma.message.findUnique({
        where: { id: flag.contentId },
        select: { content: true, isRemoved: true },
      });
      return {
        ...flag,
        contentState: content ? (content.isRemoved ? 'HIDDEN' : 'VISIBLE') : 'MISSING',
        contentPreview: content?.content.slice(0, 500) || null,
      };
    }));

    return NextResponse.json({
      flaggedContent: hydrated,
    });
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    return NextResponse.json({ error: 'Failed to fetch flagged content' }, { status: 500 });
  }
}
