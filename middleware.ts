import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // For local development - check if using subdomain approach
  const isLocalAdminDomain = hostname.includes('admin.localhost');
  const isLocalUserDomain = hostname.includes('app.localhost');

  // Production domains (you can customize these)
  const isAdminDomain = hostname.includes('admin.') || isLocalAdminDomain;
  const isUserDomain = hostname.includes('app.') || isLocalUserDomain;

  // Admin domain routing
  if (isAdminDomain) {
    // Redirect root to admin login
    if (url.pathname === '/') {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Block user routes on admin domain
    if (url.pathname.startsWith('/user')) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }

  // User domain routing
  if (isUserDomain) {
    // Redirect root to user login
    if (url.pathname === '/') {
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }

    // Block admin routes on user domain
    if (url.pathname.startsWith('/admin')) {
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
  }

  // For regular localhost:3002 (no subdomain) - redirect to login page
  if (hostname.includes('localhost:3002') && !isLocalAdminDomain && !isLocalUserDomain) {
    if (url.pathname === '/') {
      // Default to user login for regular localhost
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
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
