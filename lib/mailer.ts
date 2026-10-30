import { Resend } from 'resend';
import { SUPPORT_EMAIL } from '@/lib/site';

let client: Resend | null = null;
const FROM = process.env.RESEND_FROM_EMAIL || 'Behind the Protocol <notifications@behindtheprotocol.com>';

/** Sends a plain transactional email. Returns false (never throws) when email is not configured or fails. */
export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    client ??= new Resend(process.env.RESEND_API_KEY);
    const { error } = await client.emails.send({ from: FROM, replyTo: SUPPORT_EMAIL, to, subject, text });
    if (error) console.error('Email send failed', error.name);
    return !error;
  } catch (error) {
    console.error('Email send failed', error instanceof Error ? error.name : 'unknown');
    return false;
  }
}
