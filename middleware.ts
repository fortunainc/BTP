import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Simplified middleware without auth() calls
export default clerkMiddleware(
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
  if (["/opportunities", "/workforce", "/marketplace", "/profile"].some(path => req.nextUrl.pathname === path || req.nextUrl.pathname.startsWith(`${path}/`))) {
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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
