import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      // Only operators can view their applications
      if (user.userRole !== 'operator') {
        return NextResponse.json({ error: 'Only operators can view their applications' }, { status: 403 });
      }

      const applications = await prisma.application.findMany({
        where: {
          operatorId: user.id,
        },
        include: {
          jobPosting: {
            select: {
              id: true,
              title: true,
              description: true,
              requiredRole: true,
              requiredSkills: true,
              experienceLevel: true,
              duration: true,
              therapeuticArea: true,
              trialPhase: true,
              location: true,
              remoteCapable: true,
              organizationType: true,
              compensationBand: true,
              creatorId: true,
              status: true,
              createdAt: true,
              updatedAt: true,
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
      console.error('Error fetching user applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
  });
