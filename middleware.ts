import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSubdomainFromHostname, isPathForSubdomain, getLoginPathBySubdomain } from '@/lib/subdomain';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

function validateToken(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as { type?: 'admin' | 'client' };
  } catch (err) {
    return null;
  }
}

const isLoginPath = (pathname: string) => pathname === '/admin/login' || pathname === '/user/login';
const isApiPath = (pathname: string) => pathname.startsWith('/api');

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  console.log('[Middleware] Host:', hostname);
  console.log('[Middleware] Path:', pathname);

  // Get subdomain from hostname
  const subdomain = getSubdomainFromHostname(hostname);
  console.log('[Middleware] Subdomain:', subdomain);

  // Get user token and type
  const payload = validateToken(request);
  const userType = payload?.type;
  console.log('[Middleware] User Type:', userType);

  // Handle root path - redirect based on subdomain
  if (pathname === '/' || pathname === '') {
    console.log('[Middleware] Root path detected - redirecting based on auth');
    if (userType === 'admin') {
      console.log('[Middleware] Admin user - redirecting to /admin/dashboard');
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    } else if (userType === 'client') {
      console.log('[Middleware] Client user - redirecting to /user/dashboard');
      url.pathname = '/user/dashboard';
      return NextResponse.redirect(url);
    } else {
      // No token - redirect to appropriate login
      const loginPath = getLoginPathBySubdomain(subdomain);
      console.log('[Middleware] No auth token - redirecting to', loginPath);
      url.pathname = loginPath;
      return NextResponse.redirect(url);
    }
  }

  // Skip API and login paths from subdomain enforcement
  if (isApiPath(pathname) || isLoginPath(pathname)) {
    return NextResponse.next();
  }

  // SUBDOMAIN ENFORCEMENT - Block wrong routes on subdomains
  if (subdomain === 'admin') {
    // Admin subdomain - block user routes
    if (pathname.startsWith('/user') && !isLoginPath(pathname)) {
      console.log('[Middleware] Admin domain blocking user route');
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  } else if (subdomain === 'user') {
    // User subdomain - allow /admin/login but block other /admin routes
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      console.log('[Middleware] User domain blocking admin route (except login)');
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
  }

  // AUTHENTICATION ENFORCEMENT - Check if user has right role
  if (pathname.startsWith('/admin')) {
    // Admin routes - user must be admin
    if (!userType || userType !== 'admin') {
      console.log('[Middleware] No admin token, redirecting to login');
      url.pathname = getLoginPathBySubdomain(subdomain);
      return NextResponse.redirect(url);
    }
  } else if (pathname.startsWith('/user')) {
    // User routes - user must be client
    if (!userType || userType !== 'client') {
      console.log('[Middleware] No client token, redirecting to login');
      url.pathname = getLoginPathBySubdomain(subdomain);
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
