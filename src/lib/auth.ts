// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const TOKEN_EXPIRY = '30d';

export const AUTH_COOKIE_NAME = 'auth-token';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  type: 'client' | 'admin';
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
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static getTokenFromRequest(request: NextRequest): string | null {
    return request.cookies.get(AUTH_COOKIE_NAME)?.value ?? null;
  }

  static validateRequestAuth(request: NextRequest): AuthTokenPayload | null {
    const token = this.getTokenFromRequest(request);
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

    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
      ...(shouldSetDomain ? { domain: cookieDomain } : {}),
    });
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

    response.cookies.set(AUTH_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      ...(shouldSetDomain ? { domain: cookieDomain } : {}),
    });
  }
}

/**
 * Middleware helper for API routes
 */
export function requireAuth(request: NextRequest): { error?: string; user?: AuthTokenPayload } {
  const user = AuthService.validateRequestAuth(request);
  if (!user) return { error: 'Unauthorized' };
  return { user };
}

/**
 * Client password generation helper (since clients don't have passwords in current schema)
 */
export function generateClientPassword(email: string): string {
  return `${email.split('@')[0]}123!`;
}
