import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(['/', '/sign-in', '/about']);
const isAdminRoute = createRouteMatcher(['/admin/:path*']);

export default clerkMiddleware((auth, req) => {
  // Protect admin routes - require authentication
  if (isAdminRoute(req)) {
    if (!auth().userId) {
      // Redirect unauthenticated users to sign-in
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    // Note: Role-based access is handled in the API routes and page components
    // This middleware just ensures the user is signed in
  }

  // If user is signed in and trying to access sign-in, redirect to dashboard
  if (auth().userId && req.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect /workforce routes to /opportunities
  if (req.nextUrl.pathname.startsWith("/workforce")) {
    const newPath = req.nextUrl.pathname.replace(/^\/workforce/, "/opportunities");
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  // Redirect /marketplace to /opportunities
  if (req.nextUrl.pathname === "/marketplace") {
    return NextResponse.redirect(new URL("/opportunities", req.url));
  }

  // Redirect /signals to /situations
  if (req.nextUrl.pathname.startsWith("/signals")) {
    const newPath = req.nextUrl.pathname.replace(/^\/signals/, "/situations");
    return NextResponse.redirect(new URL(newPath, req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\\\..*|_next).*)"],
};