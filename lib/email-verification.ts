/**
 * Real Email Verification Service using Resend
 */

import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return resend;
}

export interface VerificationEmailData {
  to: string;
  code: string;
  handle: string;
}

export class EmailVerificationService {
  /**
   * Send verification code to user's email
   */
  static async sendVerificationCode(data: VerificationEmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email format
      if (!this.isValidEmail(data.to)) {
        return { success: false, error: 'Invalid email format' };
      }

      // Check if work email (not personal domain)
      if (!this.isWorkEmail(data.to)) {
        return { success: false, error: 'Personal email addresses are not allowed. Please use your work email.' };
      }

      // Send email via Resend
      const { error } = await getResendClient().emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'BehindTheProtocol <no-reply@behindtheprotocol.com>',
        to: data.to,
        subject: 'Verify Your BehindTheProtocol Account',
        html: this.getVerificationEmailHTML(data.code, data.handle),
      });

      if (error) {
        console.error('[Email Verification] Failed to send email:', error);
        return { success: false, error: 'Failed to send verification email' };
      }

      console.log(`[Email Verification] Verification code sent to ${data.to}`);
      return { success: true };
    } catch (error) {
      console.error('[Email Verification] Error sending verification email:', error);
      return { success: false, error: 'Failed to send verification email' };
    }
  }

  /**
   * Validate email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if email is work email (not personal domain)
   */
  private static isWorkEmail(email: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'mail.com', 'protonmail.com',
      'me.com', 'mac.com', 'live.com', 'msn.com'
    ];
    
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && !personalDomains.includes(domain);
  }

  /**
   * Get verification email HTML template
   */
  private static getVerificationEmailHTML(code: string, handle: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Account</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">BehindTheProtocol</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Where clinical trial operators tell the truth</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 40px 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
            <h2 style="color: #111827; margin-top: 0;">Verify Your Account</h2>
            <p style="color: #4b5563; margin-bottom: 20px;">
              Welcome to BehindTheProtocol! You're creating an anonymous account with the handle <strong>${handle}</strong>.
            </p>
            <p style="color: #4b5563; margin-bottom: 20px;">
              Your verification code is:
            </p>
            
            <div style="background: white; border: 2px dashed #10b981; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #10b981; letter-spacing: 3px;">${code}</span>
            </div>
            
            <p style="color: #4b5563; margin-bottom: 20px;">
              This code will expire in 15 minutes. Enter it in the verification screen to complete your account creation.
            </p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>🔒 Privacy Notice:</strong> Your email address will be <strong>immediately deleted</strong> after verification. We never store your email or personal information.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this verification code, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
            <p>BehindTheProtocol © 2025</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </body>
      </html>
    `;
  }
}