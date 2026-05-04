import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { DOMPurify } from '@/lib/dompurify';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';


export const POST = withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { userRole, linkedinUrl, anonymousHandle, roleCategory, companyType } = body;

      // Validation
      if (!userRole || !['operator', 'organization'].includes(userRole)) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
      }

      if (!linkedinUrl) {
        return NextResponse.json({ error: 'LinkedIn URL is required' }, { status: 400 });
      }

      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
      if (!linkedinRegex.test(linkedinUrl)) {
        return NextResponse.json({ error: 'Invalid LinkedIn URL format' }, { status: 400 });
      }

      if (!anonymousHandle || anonymousHandle.length < 3) {
        return NextResponse.json({ error: 'Anonymous handle must be at least 3 characters' }, { status: 400 });
      }

      if (userRole === 'operator' && !roleCategory) {
        return NextResponse.json({ error: 'Role category is required for operators' }, { status: 400 });
      }

      if (userRole === 'organization' && !companyType) {
        return NextResponse.json({ error: 'Company type is required for organizations' }, { status: 400 });
      }

      // Check if anonymous handle is already taken
      const existingUser = await prisma.user.findUnique({
        where: { handle: anonymousHandle.toLowerCase() },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'Anonymous handle is already taken' }, { status: 409 });
      }

      // Update user profile
      const sanitizedLinkedinUrl = DOMPurify.sanitize(linkedinUrl);
      const sanitizedHandle = DOMPurify.sanitize(anonymousHandle).toLowerCase();
      const sanitizedRoleCategory = roleCategory ? DOMPurify.sanitize(roleCategory) : undefined;
      const sanitizedCompanyType = companyType ? DOMPurify.sanitize(companyType) : undefined;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          userRole,
          linkedinUrl: sanitizedLinkedinUrl,
          handle: sanitizedHandle,
          roleCategory: sanitizedRoleCategory,
          companyCategory: sanitizedCompanyType,
          verificationStatus: 'Pending',
        },
      });

      // Log audit event
      await logAuditEvent({
        userId: user.id,
        eventType: AuditEventType.USER_UPDATED,
        resourceType: 'User',
        resourceId: user.id,
        metadata: {
          userRole,
          hasLinkedinUrl: true,
          handle: sanitizedHandle,
          roleCategory: sanitizedRoleCategory,
          companyCategory: sanitizedCompanyType,
        },
      });

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          userRole: updatedUser.userRole,
          handle: updatedUser.handle,
          verificationStatus: updatedUser.verificationStatus,
        },
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }
  });
