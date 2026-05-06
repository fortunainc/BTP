import { NextResponse } from 'next/server';

/**
 * Disabled by default.
 *
 * This route must not mint or return Clerk sessions in shared alpha builds.
 * If a developer needs a local-only auth helper, it must be implemented with
 * environment-provided credentials and an explicit local development flag.
 */
export async function GET() {
  if (process.env.ENABLE_LOCAL_TEST_LOGIN !== 'true' || process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(
    { error: 'Local test login is not configured for this build.' },
    { status: 501 }
  );
}