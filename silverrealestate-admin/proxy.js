import { NextResponse } from 'next/server';

export function proxy(request) {
  const token =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Public / Authentication routes
  const isAuthRoute = pathname === '/login';

  // Explicit list of all admin protected route prefixes
  const protectedPrefixes = [
    '/dashboard',
    '/property',
    '/add-property',
    '/property-submissions',
    '/builders',
    '/investments',
    '/users',
    '/kyc',
    '/favorites',
    '/agreements',
    '/payouts',
  ];

  const isProtectedRoute = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // Root path "/" redirection
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/dashboard' : '/login', request.url)
    );
  }

  // Already authenticated user trying to access login page
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Unauthenticated user trying to access any protected admin route
  if ((isProtectedRoute || !isAuthRoute) && !token) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/login' && pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - static image assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
