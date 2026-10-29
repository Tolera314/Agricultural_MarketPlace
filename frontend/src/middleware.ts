import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public routes accessible without authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-otp',
  '/auth/google/callback',
  '/offline',
];

/**
 * Routes that strictly require authentication
 */
const PROTECTED_PREFIXES = ['/dashboard', '/onboarding'];

/**
 * Validate redirect paths to eliminate Open Redirect vulnerabilities
 */
function getSafeRedirectUrl(pathname: string, search: string): string {
  // Must start with a single slash, not double slash or backslash
  if (pathname.startsWith('/') && !pathname.startsWith('//') && !pathname.startsWith('/\\')) {
    return pathname + (search || '');
  }
  return '/dashboard';
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Skip static assets, internal Next.js routes, and webmanifest/service workers
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // 2. Check for authentication tokens / session flags in cookies
  const hasRefreshCookie = Boolean(request.cookies.get('agrimarket_refresh')?.value);
  const hasAccessCookie = Boolean(request.cookies.get('accessToken')?.value);
  const hasClientSession = Boolean(request.cookies.get('agrimarket_session')?.value);

  const isAuthenticated = hasRefreshCookie || hasAccessCookie || hasClientSession;

  // 3. Route Protection: Block unauthenticated users from protected dashboard & onboarding pages
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !isAuthenticated) {
    const safeTarget = getSafeRedirectUrl(pathname, search);
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', safeTarget);

    const response = NextResponse.redirect(loginUrl);
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // 4. Reverse Protection: Redirect authenticated users away from login/signup to their dashboard
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  if (isAuthPage && isAuthenticated) {
    // If a safe redirect was provided in the query string, honor it; otherwise send to /dashboard
    const requestedRedirect = request.nextUrl.searchParams.get('redirect');
    const target = requestedRedirect && requestedRedirect.startsWith('/') && !requestedRedirect.startsWith('//')
      ? requestedRedirect
      : '/dashboard';

    return NextResponse.redirect(new URL(target, request.url));
  }

  // 5. Append standard security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

