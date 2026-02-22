import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from './lib/session';

export async function proxy(request: NextRequest) {
  const sessionData = await getServerSession();
  const session = sessionData?.session;
  const user = sessionData?.user;
  const pathname = request.nextUrl.pathname;

  // Protected routes - require authentication
  const protectedRoutes = ['/courses', '/dashboard', '/admin'];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Auth routes - redirect to home if already logged in
  const authRoutes = ['/login'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !session) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackURL', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && session) {
    const callbackURL = request.nextUrl.searchParams.get('callbackURL');
    const redirectUrl =
      callbackURL &&
      callbackURL.startsWith('/') &&
      !callbackURL.startsWith('//')
        ? callbackURL
        : '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // Redirect non-admin users away from admin routes
  if (isAdminRoute && user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
