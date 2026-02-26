// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { NextRequest, NextResponse } from 'next/server';
import { safeErrorMessage } from '@/lib/security/log-redaction';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const TOKEN_EXPIRY = '30d';

export const AUTH_COOKIE_NAME = 'auth-token';
export const ADMIN_AUTH_COOKIE_NAME = 'auth-token-admin';
export const CLIENT_AUTH_COOKIE_NAME = 'auth-token-client';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  type: 'client' | 'admin';
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

    return jwt.sign({ userId, email, type }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
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

  static validateRequestAuth(request: NextRequest, role?: 'admin' | 'client'): AuthTokenPayload | null {
    const token = this.getTokenFromRequestForRole(request, role);
    if (!token) return null;
    return this.verifyToken(token);
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
      sameSite: 'strict' as const,
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
export function requireAuth(
  request: NextRequest,
  role?: 'admin' | 'client'
): { error?: string; user?: AuthTokenPayload } {
  const user = AuthService.validateRequestAuth(request, role);
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
