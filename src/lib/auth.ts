import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const TOKEN_EXPIRY = '7d';

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

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: AuthTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  }

  static verifyToken(token: string): AuthTokenPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }

  static async setAuthCookie(payload: AuthTokenPayload): Promise<void> {
    const token = this.generateToken(payload);
    const cookieStore = await cookies();

    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  }

  static async getAuthCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token');
    return token?.value || null;
  }

  static async clearAuthCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = await this.getAuthCookie();
      if (!token) return null;

      const payload = this.verifyToken(token);
      if (!payload) return null;

      // Return user info from token (we could also fetch from DB for fresh data)
      return {
        id: payload.userId,
        email: payload.email,
        name: '', // We'll fetch this from the client record
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static getTokenFromRequest(request: NextRequest): string | null {
    const token = request.cookies.get('auth-token')?.value;
    return token || null;
  }

  static async validateRequestAuth(request: NextRequest): Promise<AuthTokenPayload | null> {
    const token = this.getTokenFromRequest(request);
    if (!token) return null;

    return this.verifyToken(token);
  }
}

// Middleware helper for API routes
export async function requireAuth(request: NextRequest): Promise<{ error?: string; user?: AuthTokenPayload }> {
  const user = await AuthService.validateRequestAuth(request);

  if (!user) {
    return { error: 'Unauthorized' };
  }

  return { user };
}

// Client password generation helper (since clients don't have passwords in current schema)
export function generateClientPassword(email: string): string {
  // Generate a deterministic password based on email for existing clients
  // In production, you'd want to set actual passwords or require password reset
  return `${email.split('@')[0]}123!`;
}
