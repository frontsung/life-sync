import { NextRequest, NextResponse } from 'next/server';
// adminAuth will NOT be used here anymore

// List of public routes that don't require authentication
const publicPaths = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('__session')?.value || '';

  const isLoggedIn = !!sessionCookie; // Simply check for cookie presence

  // If logged in
  if (isLoggedIn) {
    // If trying to access public paths (like / or /login), redirect to dashboard
    if (publicPaths.includes(path)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow access to the requested protected path
    return NextResponse.next();
  } else {
    // If not authenticated
    // If trying to access protected paths, redirect to login
    if (!publicPaths.includes(path)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Otherwise, allow access to public paths
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};