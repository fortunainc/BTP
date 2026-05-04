import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';
import { verificationCodes } from '../send-verification-email/route';


export const POST = withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { email, code } = body;

      // Validation
      if (!email || !code) {
        return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
      }

      if (code.length !== 6) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // Check if verification code exists and is valid
      const storedCode = verificationCodes.get(user.id);
      
      if (!storedCode) {
        return NextResponse.json({ error: 'No verification code found. Please request a new code.' }, { status: 400 });
      }

      if (storedCode.email !== email) {
        return NextResponse.json({ error: 'Email does not match' }, { status: 400 });
      }

      if (storedCode.code !== code) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      if (Date.now() > storedCode.expiresAt) {
        verificationCodes.delete(user.id);
        return NextResponse.json({ error: 'Verification code has expired. Please request a new code.' }, { status: 400 });
      }

      // Code is valid - update user with verified email
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationMethod: 'WorkEmail',
          verifiedAt: new Date(),
        },
      });

      // Remove used verification code
      verificationCodes.delete(user.id);

      // Log audit event
      await logAuditEvent({
        userId: user.id,
        eventType: AuditEventType.USER_VERIFIED,
        resourceType: 'User',
        resourceId: user.id,
        metadata: { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') },
      });

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        user: {
          id: updatedUser.id,
          verificationStatus: updatedUser.verificationStatus,
          verificationMethod: updatedUser.verificationMethod,
        },
      });
    } catch (error) {
      console.error('Verify email error:', error);
      return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }
  });
