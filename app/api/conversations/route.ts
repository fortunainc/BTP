import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
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
              createdAt: 'desc'
            },
            take: 1
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const conversationsWithCounts = conversations.map((conv) => ({
        id: conv.id,
        applicationId: conv.applicationId,
        jobPosting: conv.application.jobPosting,
        operator: conv.application.operator,
        lastMessage: conv.messages[0] || null,
        messageCount: conv._count.messages,
        updatedAt: conv.updatedAt,
        isBlocked: conv.isBlocked,
      }));

      return NextResponse.json({
        conversations: conversationsWithCounts,
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }
  });
