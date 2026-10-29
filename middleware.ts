import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

// Simplified middleware without auth() calls
const clerkHandler = clerkMiddleware(
  (_auth, req) => {
  const dormantApiPrefixes = [
    "/api/applications",
    "/api/conversations",
    "/api/cron/scan-opportunities",
    "/api/fee-records",
    "/api/hires",
    "/api/job-postings",
    "/api/micro-opportunities",
    "/api/operator-profiles",
    "/api/opportunities",
  ];
  if (dormantApiPrefixes.some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`))) {
    return NextResponse.json({ error: "This feature is not available in the BTP beta." }, { status: 404 });
  }

  // Route redirects
  // Dormant marketplace/workforce surfaces are intentionally unreachable in beta.
  if (["/opportunities", "/workforce", "/marketplace", "/profile", "/dashboard", "/demo", "/messages"].some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`))) {
    return NextResponse.redirect(new URL("/situations", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/signals")) {
    const newPath = req.nextUrl.pathname.replace(/^\/signals/, "/situations");
    return NextResponse.redirect(new URL(newPath, req.url));
  }
  },
  {
    frontendApiProxy: {
      enabled: true,
    },
  },
);

// Preview builds must not read or mutate the shared production database.
// Enable only after provisioning and verifying an independent preview database.
export default function middleware(req: NextRequest, event: NextFetchEvent) {
  if (process.env.VERCEL_ENV === 'preview' && process.env.BTP_PREVIEW_DATABASE_ISOLATED !== 'true' && req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Preview data access is disabled until an isolated database is configured.' }, { status: 503 });
  }
  // Waitlist pages and submissions are public and do not require a Clerk session.
  if (req.nextUrl.pathname === '/join' || req.nextUrl.pathname.startsWith('/join/') || req.nextUrl.pathname === '/api/join') return NextResponse.next();
  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
