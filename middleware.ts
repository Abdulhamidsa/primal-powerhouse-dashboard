import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSubdomainFromHostname } from '@/lib/subdomain';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const AUTH_COOKIE_NAME = 'auth-token';
const ADMIN_AUTH_COOKIE_NAME = 'auth-token-admin';
const CLIENT_AUTH_COOKIE_NAME = 'auth-token-client';
const JWT_SECRET = process.env.JWT_SECRET || '';

type AuthPayload = {
  userId: string;
  email: string;
  type: 'client' | 'admin';
  iat?: number;
  exp?: number;
};

async function verifyJwt(token: string): Promise<AuthPayload | null> {
  try {
    const [headerPart, payloadPart, signaturePart] = token.split('.');
    if (!headerPart || !payloadPart || !signaturePart) return null;

    const enc = new TextEncoder();
    const data = `${headerPart}.${payloadPart}`;
    const key = await crypto.subtle.importKey('raw', enc.encode(JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, [
      'verify',
    ]);

    const signature = base64UrlToUint8Array(signaturePart);
    const valid = await crypto.subtle.verify('HMAC', key, signature, enc.encode(data));
    if (!valid) return null;

    const payloadJson = atobUrlSafe(payloadPart);
    const payload = JSON.parse(payloadJson) as AuthPayload;

    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload;
  } catch (error) {
    console.error('[AUTH] Middleware JWT verify failed:', safeErrorMessage(error));
    return null;
  }
}

function atobUrlSafe(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return atob(padded);
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const isApiPath = (pathname: string) => pathname.startsWith('/api');
const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
const corsMethods = 'GET, POST, PUT, PATCH, DELETE, OPTIONS';
const corsHeaders = 'Authorization, Content-Type';

function developmentCorsOrigin(request: NextRequest): string | null {
  if (process.env.NODE_ENV === 'production') return null;
  const origin = request.headers.get('origin');
  if (!origin) return null;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && loopbackHosts.has(url.hostname) ? origin : null;
  } catch {
    return null;
  }
}

function applyDevelopmentCors(response: NextResponse, origin: string): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', corsMethods);
  response.headers.set('Access-Control-Allow-Headers', corsHeaders);
  const vary = response.headers.get('Vary');
  const variesByOrigin = vary
    ?.split(',')
    .some((value) => value.trim().toLowerCase() === 'origin');
  if (!variesByOrigin) {
    response.headers.set('Vary', vary ? `${vary}, Origin` : 'Origin');
  }
  return response;
}

const isPwaAsset = (pathname: string) => {
  if (pathname === '/manifest.json') return true;
  if (pathname === '/sw.js') return true;
  if (pathname === '/service-worker.js') return true;
  if (pathname === '/favicon.ico') return true;
  if (pathname.startsWith('/icon-')) return true;
  return false;
};

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const pathname = url.pathname;

  // Keep subdomain for "/" routing only
  const subdomain = getSubdomainFromHostname(hostname);

  if (isApiPath(pathname)) {
    const corsOrigin = developmentCorsOrigin(request);
    if (request.method === 'OPTIONS' && corsOrigin) {
      return applyDevelopmentCors(new NextResponse(null, { status: 204 }), corsOrigin);
    }
    const response = NextResponse.next();
    return corsOrigin ? applyDevelopmentCors(response, corsOrigin) : response;
  }

  const adminToken = request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ?? null;
  const clientToken = request.cookies.get(CLIENT_AUTH_COOKIE_NAME)?.value ?? null;
  const legacyToken = request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;

  const adminPayload = adminToken ? await verifyJwt(adminToken) : null;
  const clientPayload = clientToken ? await verifyJwt(clientToken) : null;
  const legacyPayload = legacyToken ? await verifyJwt(legacyToken) : null;

  const payload = adminPayload ?? clientPayload ?? legacyPayload;

  const isAuthenticated = Boolean(payload);
  const isAdmin = Boolean(adminPayload || payload?.type === 'admin');
  const isClient = Boolean(clientPayload || payload?.type === 'client');

  // Allow PWA assets
  if (isPwaAsset(pathname)) {
    return NextResponse.next();
  }

  // --- Login pages: block when authenticated (role-aware)
  if (pathname === '/admin/login' && isAuthenticated) {
    url.pathname = isAdmin ? '/admin/dashboard' : '/user/dashboard';
    return NextResponse.redirect(url);
  }
  if (pathname === '/user/login' && isAuthenticated) {
    url.pathname = isAdmin ? '/admin/dashboard' : '/user/dashboard';
    return NextResponse.redirect(url);
  }

  // --- Protect /admin/*
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!isAuthenticated) {
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    if (!isAdmin) {
      url.pathname = '/user/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // --- Protect /user/*
  if (pathname.startsWith('/user') && pathname !== '/user/login') {
    if (!isAuthenticated) {
      url.pathname = '/user/login';
      return NextResponse.redirect(url);
    }
    if (!isClient) {
      url.pathname = '/admin/dashboard';
      return NextResponse.redirect(url);
    }
  }

  // Root redirect
  if (pathname === '/') {
    if (isAuthenticated) {
      url.pathname = isAdmin ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(url);
    }
    url.pathname = subdomain === 'admin' ? '/admin/login' : '/user/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/((?!api|_next|.*\\..*).*)'],
};
