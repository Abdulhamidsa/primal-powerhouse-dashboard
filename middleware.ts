import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

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

const isAdminPath = (pathname: string) => pathname.startsWith('/admin');
const isUserPath = (pathname: string) => pathname.startsWith('/user');
const isLoginPath = (pathname: string) => pathname === '/admin/login' || pathname === '/user/login';
const isApiPath = (pathname: string) => pathname.startsWith('/api');

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

    // Block admin routes on user domain, but allow admin login
    if (url.pathname.startsWith('/admin') && url.pathname !== '/admin/login') {
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
  }

  // For regular localhost - check if user is authenticated before redirecting
  if (hostname.includes('localhost') && !isLocalAdminDomain && !isLocalUserDomain) {
    if (url.pathname === '/') {
      // Check authentication token
      const payload = validateToken(request);
      if (payload && payload.type === 'client') {
        // User is authenticated, redirect to user dashboard
        url.pathname = '/user/dashboard';
        return NextResponse.redirect(url);
      } else if (payload && payload.type === 'admin') {
        // Admin is authenticated, redirect to admin dashboard
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
      }
      // Not authenticated, let the page handle it (no redirect from middleware)
    }
  }

  // Global protection for admin/user paths even on localhost:3000
  if (!isApiPath(url.pathname) && !isLoginPath(url.pathname)) {
    if (isAdminPath(url.pathname)) {
      const payload = validateToken(request);
      if (!payload || payload.type !== 'admin') {
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
    }

    if (isUserPath(url.pathname)) {
      const payload = validateToken(request);
      if (!payload || payload.type !== 'client') {
        url.pathname = '/user/login';
        return NextResponse.redirect(url);
      }
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
