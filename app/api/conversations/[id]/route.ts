import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';

export const GET = withAuth(async (req, user) => {
    try {
      const url = new URL(req.url); const pathSegments = url.pathname.split('/'); const id = pathSegments[3];
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: id,
          OR: [
            { organizationId: user.id },
            { operatorId: user.id }
          ]
        },
        include: {
          application: {
            include: {
              operator: {
                select: {
                  id: true,
                  handle: true,
                }
              },
              jobPosting: {
                select: {
                  id: true,
                  title: true,
                }
              }
            }
          },
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            take: 50
          }
        },
      });

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json({
        conversation,
      });
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 });
    }
  });