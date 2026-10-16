import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse, type NextFetchEvent } from 'next/server';
vi.mock('@clerk/nextjs/server', () => ({ clerkMiddleware: () => () => NextResponse.next() }));
import middleware from '@/middleware';
afterEach(() => vi.unstubAllEnvs());
it('blocks every preview API before authentication when data is not isolated', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview'); vi.stubEnv('BTP_PREVIEW_DATABASE_ISOLATED', 'false');
  for (const method of ['GET','POST','PATCH','DELETE']) expect((await middleware(new NextRequest('https://preview.test/api/help-requests', { method }), {} as NextFetchEvent))?.status).toBe(503);
  expect((await middleware(new NextRequest('https://preview.test/'), {} as NextFetchEvent))?.status).toBe(200);
});
it('permits production and explicitly isolated previews to reach normal auth', async () => {
  for (const environment of ['production','preview']) { vi.stubEnv('VERCEL_ENV', environment); vi.stubEnv('BTP_PREVIEW_DATABASE_ISOLATED', 'true'); expect((await middleware(new NextRequest('https://btp.test/api/situations'), {} as NextFetchEvent))?.status).toBe(200); }
});
