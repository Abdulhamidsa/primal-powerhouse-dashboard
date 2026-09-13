// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { NextRequest, NextResponse } from 'next/server';
import { safeErrorMessage } from '@/lib/security/log-redaction';

import { getJwtSecret } from '@/lib/security/jwt-secret';
import { prisma } from '@/lib/prisma';
import { requiresEmailVerification } from '@/lib/auth/client-verification';
const TOKEN_EXPIRY = '30d';

export const AUTH_COOKIE_NAME = 'auth-token';
export const ADMIN_AUTH_COOKIE_NAME = 'auth-token-admin';
export const CLIENT_AUTH_COOKIE_NAME = 'auth-token-client';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  type: 'client' | 'admin';
  sid?: string;
  authenticatedAt?: number;
  issuedAtMs?: number;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

function isLocalhostHost(hostname: string): boolean {
  const host = hostname.split(':')[0].toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return true;

  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;

  return false;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: AuthTokenPayload): string {
    const { userId, email, type } = payload;

    return jwt.sign({ userId, email, type, issuedAtMs: Date.now(), authenticatedAt: payload.authenticatedAt ?? Math.floor(Date.now() / 1000) }, getJwtSecret(), { algorithm: 'HS256', expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] }) as AuthTokenPayload;
      if (!payload || typeof payload.userId !== 'string' || !['client', 'admin'].includes(payload.type) || payload.sid) return null;
      return payload;
    } catch (error) {
      console.error('Token verification failed:', safeErrorMessage(error));
      return null;
    }
  }

  static getTokenFromRequest(request: NextRequest): string | null {
    return (
      request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ??
      request.cookies.get(CLIENT_AUTH_COOKIE_NAME)?.value ??
      request.cookies.get(AUTH_COOKIE_NAME)?.value ??
      null
    );
  }

  static getTokenFromRequestForRole(request: NextRequest, role?: 'admin' | 'client'): string | null {
    if (role === 'admin') {
      return request.cookies.get(ADMIN_AUTH_COOKIE_NAME)?.value ?? request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
    }
    if (role === 'client') {
      return (
        request.cookies.get(CLIENT_AUTH_COOKIE_NAME)?.value ?? request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null
      );
    }
    return this.getTokenFromRequest(request);
  }

  static async validateRequestAuth(request: NextRequest, role?: 'admin' | 'client'): Promise<AuthTokenPayload | null> {
    const authorization = request.headers.get('authorization');
    const bearer = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    const token = bearer ?? this.getTokenFromRequestForRole(request, role);
    if (!token) return null;
    let payload: AuthTokenPayload | null;
    if (bearer) {
      try { payload = jwt.verify(bearer, getJwtSecret(), { algorithms: ['HS256'], audience: 'primal-mobile' }) as AuthTokenPayload; }
      catch { return null; }
      if (!payload.sid || payload.type !== 'client') return null;
      const session = await prisma.mobileSession.findUnique({ where: { id: payload.sid } });
      if (!session || session.clientId !== payload.userId || session.revokedAt || session.expiresAt <= new Date()) return null;
      payload.authenticatedAt = Math.floor(session.authenticatedAt.getTime() / 1000);
    } else {
      payload = this.verifyToken(token);
      if (payload?.sid) return null;
    }
    if (!payload || (role && payload.type !== role)) return null;
    if (payload.type === 'client') {
      const client = await prisma.client.findUnique({ where: { id: payload.userId }, select: { status: true, authInvalidBefore: true, deactivatedAt: true, signupSource: true, emailVerifiedAt: true } });
      if (!client || client.status === 'ARCHIVED' || client.status === 'INACTIVE' || client.deactivatedAt) return null;
      if (requiresEmailVerification(client)) return null;
      if (!bearer && client.authInvalidBefore && (payload.issuedAtMs ?? (payload.iat ?? 0) * 1000) <= client.authInvalidBefore.getTime()) return null;
    }
    return payload;
  }

  /**
   * Cookie setter helpers
   * Use these in route handlers where you already have a NextResponse.
   * Do NOT use next/headers cookies() to set cookies in API route handlers.
   *
   * IMPORTANT: do not set a cookie domain on localhost (cookie won't be sent to localhost).
   */
  static setAuthCookieOnResponse(
    response: NextResponse,
    payload: AuthTokenPayload,
    options?: {
      rememberMe?: boolean;
      cookieDomain?: string;
      requestHost?: string; // pass request.headers.get('host')
      sameSite?: 'strict' | 'lax';
    }
  ): void {
    const token = this.generateToken(payload);

    const rememberMe = Boolean(options?.rememberMe);
    const cookieDomain = options?.cookieDomain ?? process.env.COOKIE_DOMAIN;
    const requestHost = options?.requestHost ?? '';

    const isLocalhost = requestHost ? isLocalhostHost(requestHost) : false;

    // Only set domain in production AND when not on localhost/IP
    const shouldSetDomain = Boolean(cookieDomain) && process.env.NODE_ENV === 'production' && !isLocalhost;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: options?.sameSite ?? 'strict' as const,
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
      ...(shouldSetDomain ? { domain: cookieDomain } : {}),
    };

    const roleCookieName = payload.type === 'admin' ? ADMIN_AUTH_COOKIE_NAME : CLIENT_AUTH_COOKIE_NAME;

    response.cookies.set(roleCookieName, token, cookieOptions);
    response.cookies.set(AUTH_COOKIE_NAME, token, cookieOptions);
  }

  static clearAuthCookieOnResponse(
    response: NextResponse,
    options?: {
      cookieDomain?: string;
      requestHost?: string;
    }
  ): void {
    const cookieDomain = options?.cookieDomain ?? process.env.COOKIE_DOMAIN;
    const requestHost = options?.requestHost ?? '';
    const isLocalhost = requestHost ? isLocalhostHost(requestHost) : false;

    const shouldSetDomain = Boolean(cookieDomain) && process.env.NODE_ENV === 'production' && !isLocalhost;

    const clearOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0,
      ...(shouldSetDomain ? { domain: cookieDomain } : {}),
    };

    response.cookies.set(AUTH_COOKIE_NAME, '', clearOptions);
    response.cookies.set(ADMIN_AUTH_COOKIE_NAME, '', clearOptions);
    response.cookies.set(CLIENT_AUTH_COOKIE_NAME, '', clearOptions);
  }
}

/**
 * Middleware helper for API routes
 */
export async function requireAuth(
  request: NextRequest,
  role?: 'admin' | 'client'
): Promise<{ error?: string; user?: AuthTokenPayload }> {
  const user = await AuthService.validateRequestAuth(request, role);
  if (!user) return { error: 'Unauthorized' };
  if (role && user.type !== role) return { error: 'Unauthorized' };
  return { user };
}

/**
 * Client password generation helper (since clients don't have passwords in current schema)
 */
export function generateClientPassword(email: string): string {
  return `${email.split('@')[0]}123!`;
}
