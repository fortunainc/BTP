import { NextResponse } from 'next/server';

// Legacy surface is intentionally unavailable in the invite-only beta.
export async function GET() {
  return NextResponse.json({ error: 'This feature is unavailable. Contact BTP support for invitation or verification help.' }, { status: 404 });
}
