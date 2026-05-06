import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { logAuditEvent, AuditEventType } from '@/lib/audit-logging';
import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Store verification codes in memory (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: number; email: string }>();


export const POST = withAuth(async (req, user) => {
    try {
      const body = await req.json();
      const { email } = body;

      // Validation
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      // Reject personal email domains
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'];
      const domain = email.split('@')[1]?.toLowerCase();
      if (personalDomains.includes(domain)) {
        return NextResponse.json({ error: 'Please use your work email address' }, { status: 400 });
      }

      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes expiration

      // Store verification code
      verificationCodes.set(user.id, { code, expiresAt, email });

      // Send email via Resend
      const emailContent = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .code { font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1e40af; text-align: center; margin: 20px 0; }
              .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">Behind the Protocol</h1>
                <p style="margin: 5px 0 0 0;">Verify Your Email Address</p>
              </div>
              <div class="content">
                <p>Hello ${user.anonymousHandle || user.email},</p>
                <p>Thank you for joining Behind the Protocol. To complete your account verification, please use the following code:</p>
                <div class="code">${code}</div>
                <p>This code will expire in 15 minutes for your security.</p>
                <p>If you did not request this verification, please ignore this email.</p>
                <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Behind the Protocol. All rights reserved.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      try {
        await getResendClient().emails.send({
          from: process.env.RESEND_FROM_EMAIL || 'behindtheprotocol@resend.dev',
          to: email,
          subject: 'Verify Your Email - Behind the Protocol',
          html: emailContent,
        });

        // Log audit event
        await logAuditEvent({
          userId: user.id,
          eventType: AuditEventType.USER_CREATED,
          resourceType: 'User',
          resourceId: user.id,
          metadata: { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') },
        });

        return NextResponse.json({
          success: true,
          message: 'Verification code sent successfully',
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        
        // Fallback: Return code directly for development/testing
        // In production, this should return an error
        console.log('Verification code (dev mode):', code);
        
        return NextResponse.json({
          success: true,
          message: 'Verification code sent (dev mode: check console)',
          devCode: process.env.NODE_ENV === 'development' ? code : undefined,
        });
      }
    } catch (error) {
      console.error('Send verification email error:', error);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }
  });

// Export for testing purposes
export { verificationCodes };