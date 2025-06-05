// middleware.ts
import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/']);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl.pathname;
  if (url === '/sign-in' || url === '/sign-up' || url === '/chat') {
    // Redirect to home or show maintenance
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!.*\\..*|_next).*)',
    '/',
    '/(api|trpc)(.*)',
  ],
};