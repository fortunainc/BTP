import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';


export const GET = withAuth(async (req, user) => {
    try {
      // Check if user is admin
      if (user.userRole !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');

      const auditLogs = await prisma.auditLog.findMany({
        take: limit,
        skip: offset,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json({
        auditLogs,
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  });
