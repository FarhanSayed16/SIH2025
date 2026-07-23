/**
 * Next.js middleware for route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public routes
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // For protected routes, check auth on client side
  // Server-side auth check would require cookies/sessions
  return NextResponse.next();
}

export const config = {
  // Exclude all API routes - they should go to backend, not Next.js
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};

