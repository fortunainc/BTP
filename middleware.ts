import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy',
  '/situations',
]);

// Simplified middleware without auth() calls
export default clerkMiddleware((auth, req) => {
  // Route redirects
  if (req.nextUrl.pathname.startsWith("/workforce")) {
    const newPath = req.nextUrl.pathname.replace(/^\/workforce/, "/opportunities");
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  if (req.nextUrl.pathname === "/marketplace") {
    return NextResponse.redirect(new URL("/opportunities", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/signals")) {
    const newPath = req.nextUrl.pathname.replace(/^\/signals/, "/situations");
    return NextResponse.redirect(new URL(newPath, req.url));
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};