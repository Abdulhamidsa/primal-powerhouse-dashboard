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

  // Get subdomain from hostname
  const subdomain = getSubdomainFromHostname(hostname);

  // Get user token and type
  const payload = validateToken(request);
  const userType = payload?.type;

  // Skip API and login paths from subdomain enforcement
  if (isApiPath(pathname) || isLoginPath(pathname)) {
    return NextResponse.next();
  }

  // SUBDOMAIN ENFORCEMENT - Block wrong routes on subdomains
  if (subdomain === 'admin') {
    // Admin subdomain - block user routes
    if (pathname.startsWith('/user') && !isLoginPath(pathname)) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  } else if (subdomain === 'user') {
    // User subdomain - allow /admin/login but block other /admin routes
    if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
  }

  // AUTHENTICATION ENFORCEMENT - Check if user has right role
  if (pathname.startsWith('/admin')) {
    // Admin routes - user must be admin
    if (!userType || userType !== 'admin') {
      url.pathname = getLoginPathBySubdomain(subdomain);
      return NextResponse.redirect(url);
    }
  } else if (pathname.startsWith('/user')) {
    // User routes - user must be client
    if (!userType || userType !== 'client') {
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
