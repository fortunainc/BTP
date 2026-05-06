import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      // Only organizations can view applications to their job postings
      if (user.userRole !== 'organization') {
        return NextResponse.json({ error: 'Only organizations can view applications' }, { status: 403 });
      }

      const applications = await prisma.application.findMany({
        where: {
          jobPosting: {
            creatorId: user.id,
          },
        },
        include: {
          operator: {
            select: {
              id: true,
              handle: true,
            },
          },
          jobPosting: {
            select: {
              id: true,
              title: true,
              compensationBand: true,
              duration: true,
              location: true,
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
      });

      return NextResponse.json({
        applications,
      });
    } catch (error) {
      console.error('Error fetching organization applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
  });
