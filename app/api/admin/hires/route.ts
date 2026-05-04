import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const hires = await prisma.hire.findMany({
        include: {
          application: {
            include: {
              jobPosting: true,
              operator: {
                select: {
                  handle: true,
                },
              },
            },
          },
          feeRecord: true,
        },
        orderBy: {
          hireDate: 'desc',
        },
      });

      return NextResponse.json({
        hires,
      });
    } catch (error) {
      console.error('Error fetching hires:', error);
      return NextResponse.json({ error: 'Failed to fetch hires' }, { status: 500 });
    }
  });
