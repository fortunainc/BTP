import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { DOMPurify } from '@/lib/dompurify';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';


export const POST = withAuth(async (req, user) => {
    try {
      const body = await req.json().catch(() => ({}));
      const { userRole, linkedinUrl, anonymousHandle, roleCategory, companyType, yearsExperience } = body;
      const years = Number(yearsExperience);

      // Validation
      if (!userRole || !['operator', 'organization'].includes(userRole)) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
      }

      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
      if (linkedinUrl && !linkedinRegex.test(linkedinUrl)) {
        return NextResponse.json({ error: 'Invalid LinkedIn URL format' }, { status: 400 });
      }

      if (typeof anonymousHandle !== 'string' || !/^[a-zA-Z0-9_-]{3,30}$/.test(anonymousHandle.trim())) {
        return NextResponse.json({ error: 'Display handle must be 3-30 letters, numbers, dashes or underscores' }, { status: 400 });
      }

      if (!Number.isInteger(years) || years < 0 || years > 50) {
        return NextResponse.json({ error: 'Enter your years of experience in clinical research (0 to 50)' }, { status: 400 });
      }
      if (userRole === 'operator' && !roleCategory) {
        return NextResponse.json({ error: 'Role category is required for operators' }, { status: 400 });
      }

      if (userRole === 'organization' && !companyType) {
        return NextResponse.json({ error: 'Company type is required for organizations' }, { status: 400 });
      }

      // Check if anonymous handle is already taken
      const existingUser = await prisma.user.findUnique({
        where: { handle: anonymousHandle.trim().toLowerCase() },
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: 'That display handle is already taken' }, { status: 409 });
      }

      // Update user profile
      const sanitizedLinkedinUrl = linkedinUrl ? DOMPurify.sanitize(linkedinUrl) : null;
      const sanitizedHandle = DOMPurify.sanitize(anonymousHandle.trim()).toLowerCase();
      const sanitizedRoleCategory = roleCategory ? DOMPurify.sanitize(roleCategory) : undefined;
      const sanitizedCompanyType = companyType ? DOMPurify.sanitize(companyType) : undefined;

      const current = await prisma.user.findUnique({ where: { id: user.id }, select: { linkedinProofCode: true } });
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          // Never downgrade staff roles through self-service onboarding.
          userRole: ['admin', 'founder'].includes(user.userRole) ? user.userRole : userRole,
          linkedinUrl: sanitizedLinkedinUrl,
          // Approved members keep the years confirmed at review.
          ...(user.verificationStatus === 'Approved' ? {} : { yearsExperience: years }),
          // One-time code the member adds to their LinkedIn profile so BTP can confirm it is theirs.
          ...(sanitizedLinkedinUrl && user.verificationStatus !== 'Approved'
            ? { linkedinProofCode: current?.linkedinProofCode ?? `BTP-${randomBytes(3).toString('hex').toUpperCase()}` }
            : { linkedinProofCode: null }),
          handle: sanitizedHandle,
          // The verified role label is set at review; approved members cannot self-change it.
          roleCategory: user.verificationStatus === 'Approved' && user.roleCategory && user.roleCategory !== 'unspecified' ? user.roleCategory : sanitizedRoleCategory,
          companyCategory: sanitizedCompanyType,
          ...(user.verificationStatus === 'Approved' ? {} : { verificationStatus: 'Pending' }),
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
          hasLinkedinUrl: Boolean(sanitizedLinkedinUrl),
          yearsExperience: years,
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
        linkedinProofCode: updatedUser.linkedinProofCode,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        return NextResponse.json({ error: 'That display handle is already taken' }, { status: 409 });
      }
      console.error('Onboarding error:', error);
      return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }
  });
