import { Resend } from 'resend';

let resend: Resend | null = null;

function getResendClient() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not set, emails will be logged only');
      return null;
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

export interface ThreadReplyNotificationData {
  toEmail: string;
  toName: string;
  threadTitle: string;
  threadId: string;
  replyAuthor: string;
  replyPreview: string;
}

export interface NewMessageNotificationData {
  toEmail: string;
  toName: string;
  fromName: string;
  messagePreview: string;
  threadTitle: string;
  threadId: string;
}

export interface JobMatchNotificationData {
  toEmail: string;
  toName: string;
  jobTitle: string;
  companyName: string;
  jobId: string;
}

export interface MostHelpfulNotificationData {
  toEmail: string;
  toName: string;
  threadTitle: string;
  threadId: string;
  helpfulVotes: number;
}

async function sendEmail(to: string, subject: string, html: string) {
  const client = getResendClient();
  
  if (!client) {
    console.log('=== EMAIL NOT SENT (No API Key) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML: ${html.substring(0, 200)}...`);
    return { success: true, logged: true };
  }

  try {
    const result = await client.emails.send({
      from: 'Behind the Protocol <notifications@behindtheprotocol.com>',
      to,
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
}

export async function sendThreadReplyNotification(data: ThreadReplyNotificationData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://behindtheprotocol.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📢 New Reply to Your Thread</h1>
          </div>
          <div class="content">
            <p>Hi ${data.toName},</p>
            <p><strong>${data.replyAuthor}</strong> just replied to your thread:</p>
            <h3 style="color: #0f172a;">${data.threadTitle}</h3>
            <p style="color: #64748b; font-style: italic;">"${data.replyPreview.substring(0, 150)}..."</p>
            <a href="${baseUrl}/threads/${data.threadId}" class="button">View Reply</a>
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
              You're receiving this because you posted the original thread.
            </p>
          </div>
          <div class="footer">
            <p>Behind the Protocol — Anonymous Clinical Trial Operations Network</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(data.toEmail, `New Reply: ${data.threadTitle}`, html);
}

export async function sendNewMessageNotification(data: NewMessageNotificationData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://behindtheprotocol.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 New Message</h1>
          </div>
          <div class="content">
            <p>Hi ${data.toName},</p>
            <p><strong>${data.fromName}</strong> sent you a message:</p>
            <h3 style="color: #0f172a;">${data.threadTitle}</h3>
            <p style="color: #64748b; font-style: italic;">"${data.messagePreview.substring(0, 150)}..."</p>
            <a href="${baseUrl}/messages/${data.threadId}" class="button">View Message</a>
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
              You're receiving this because you're part of this conversation.
            </p>
          </div>
          <div class="footer">
            <p>Behind the Protocol — Anonymous Clinical Trial Operations Network</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(data.toEmail, `New Message from ${data.fromName}`, html);
}

export async function sendJobMatchNotification(data: JobMatchNotificationData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://behindtheprotocol.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 New Job Match</h1>
          </div>
          <div class="content">
            <p>Hi ${data.toName},</p>
            <p>We found a job that matches your profile:</p>
            <h3 style="color: #0f172a; font-size: 20px;">${data.jobTitle}</h3>
            <p style="color: #64748b; font-size: 16px;"><strong>${data.companyName}</strong></p>
            <a href="${baseUrl}/workforce/apply/${data.jobId}" class="button">View Job & Apply</a>
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
              This job matches your skills and experience profile.
            </p>
          </div>
          <div class="footer">
            <p>Behind the Protocol — Anonymous Clinical Trial Operations Network</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(data.toEmail, `New Job Match: ${data.jobTitle}`, html);
}

export async function sendMostHelpfulNotification(data: MostHelpfulNotificationData) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://behindtheprotocol.com';
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; font-size: 24px; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .badge { background: #F5A623; color: #0F1115; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Your Answer Was Marked Most Helpful!</h1>
          </div>
          <div class="content">
            <p>Hi ${data.toName},</p>
            <div class="badge">⭐ Most Helpful Answer</div>
            <p>Congratulations! Your reply to <strong>${data.threadTitle}</strong> was marked as the most helpful answer by the thread author.</p>
            <p style="font-size: 18px; color: #0f172a; margin-top: 20px;">
              <strong>${data.helpfulVotes} operators</strong> found your answer helpful
            </p>
            <a href="${baseUrl}/threads/${data.threadId}" class="button">View Your Answer</a>
            <p style="margin-top: 20px; font-size: 14px; color: #64748b;">
              This recognition increases your Helpful Score and builds your reputation in the community.
            </p>
          </div>
          <div class="footer">
            <p>Behind the Protocol — Anonymous Clinical Trial Operations Network</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail(data.toEmail, `🏆 Your Answer Was Marked Most Helpful!`, html);
}