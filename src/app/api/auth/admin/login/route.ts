import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!process.env.DATABASE_URL) {
      console.error('[ADMIN LOGIN] DATABASE_URL not configured');
      return NextResponse.json(
        { error: 'Database configuration error' },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[ADMIN LOGIN] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      console.warn('[ADMIN LOGIN] Missing credentials');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find admin/coach user by email
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      console.log('[ADMIN LOGIN] User lookup completed:', { email: email.toLowerCase().trim(), found: !!user });
    } catch (queryError) {
      console.error('[ADMIN LOGIN] Database query error:', {
        error: queryError instanceof Error ? queryError.message : String(queryError),
      });
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (!user) {
      console.warn('[ADMIN LOGIN] User not found:', email.toLowerCase().trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if user is actually a coach/admin
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      console.warn('[ADMIN LOGIN] User is not a coach/admin:', { email: user.email, role: user.role });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password
    let isValidPassword = false;
    try {
      isValidPassword = await AuthService.verifyPassword(password, user.password);
      console.log('[ADMIN LOGIN] Password verification completed:', { isValid: isValidPassword });
    } catch (authError) {
      console.error('[ADMIN LOGIN] Password verification error:', {
        error: authError instanceof Error ? authError.message : String(authError),
      });
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      console.warn('[ADMIN LOGIN] Invalid password for:', email.toLowerCase().trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT token and set cookie
    try {
      await AuthService.setAuthCookie({
        userId: user.id,
        email: user.email,
        type: 'admin',
      });
      console.log('[ADMIN LOGIN] Auth cookie set successfully for:', user.email);
    } catch (cookieError) {
      console.error('[ADMIN LOGIN] Failed to set auth cookie:', {
        error: cookieError instanceof Error ? cookieError.message : String(cookieError),
      });
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    console.log('[ADMIN LOGIN] Login successful for:', user.email);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: 'admin',
      },
      redirect: '/admin/dashboard',
    });
  } catch (error) {
    console.error('[ADMIN LOGIN] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'production' 
          ? 'An unexpected error occurred' 
          : error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
