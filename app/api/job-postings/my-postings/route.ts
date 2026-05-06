import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      // Only organizations can view their job postings
      if (user.userRole !== 'organization') {
        return NextResponse.json({ error: 'Only organizations can view their job postings' }, { status: 403 });
      }

      const jobPostings = await prisma.jobPosting.findMany({
        where: {
          creatorId: user.id,
        },
        include: {
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({
        jobPostings,
      });
    } catch (error) {
      console.error('Error fetching job postings:', error);
      return NextResponse.json({ error: 'Failed to fetch job postings' }, { status: 500 });
    }
  });
