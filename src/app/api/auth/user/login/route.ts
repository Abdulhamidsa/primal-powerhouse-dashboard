import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService, generateClientPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Validate environment
    if (!process.env.DATABASE_URL) {
      console.error('[LOGIN] DATABASE_URL not configured');
      return NextResponse.json(
        { error: 'Database configuration error', details: 'DATABASE_URL missing' },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('[LOGIN] JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Authentication configuration error', details: 'JWT_SECRET missing' },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('[LOGIN] Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request format', details: 'Unable to parse JSON body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password) {
      console.warn('[LOGIN] Missing credentials');
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Test database connection
    try {
      await prisma.$connect();
      console.log('[LOGIN] Database connected successfully');
    } catch (dbError) {
      console.error('[LOGIN] Database connection failed:', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
      });
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError instanceof Error ? dbError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    // Find client by email
    let client;
    try {
      client = await prisma.client.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
          coach: {
            select: { name: true, email: true },
          },
        },
      });
      console.log('[LOGIN] Client lookup completed:', { email: email.toLowerCase().trim(), found: !!client });
    } catch (queryError) {
      console.error('[LOGIN] Database query error:', {
        error: queryError instanceof Error ? queryError.message : String(queryError),
        stack: queryError instanceof Error ? queryError.stack : undefined,
      });
      return NextResponse.json(
        { error: 'Database query failed', details: queryError instanceof Error ? queryError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!client) {
      console.warn('[LOGIN] Client not found:', email.toLowerCase().trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if client has a password set
    let isValidPassword = false;

    try {
      if (client.password) {
        // Client has a stored password, verify it
        isValidPassword = await AuthService.verifyPassword(password, client.password);
        console.log('[LOGIN] Password verification completed:', { isValid: isValidPassword });
      } else {
        // Client doesn't have a password yet, check against generated default
        const defaultPassword = generateClientPassword(client.email);
        isValidPassword = password === defaultPassword;
        console.log('[LOGIN] Default password check:', { isValid: isValidPassword });

        // If valid, hash and store the password for future use
        if (isValidPassword) {
          const hashedPassword = await AuthService.hashPassword(password);
          await prisma.client.update({
            where: { id: client.id },
            data: { password: hashedPassword },
          });
          console.log('[LOGIN] Password stored for future use');
        }
      }
    } catch (authError) {
      console.error('[LOGIN] Authentication error:', {
        error: authError instanceof Error ? authError.message : String(authError),
        stack: authError instanceof Error ? authError.stack : undefined,
      });
      return NextResponse.json(
        { error: 'Authentication failed', details: authError instanceof Error ? authError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!isValidPassword) {
      console.warn('[LOGIN] Invalid password for:', email.toLowerCase().trim());
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT token and set cookie
    try {
      await AuthService.setAuthCookie({
        userId: client.id,
        email: client.email,
        type: 'client',
      });
      console.log('[LOGIN] Auth cookie set successfully for:', client.email);
    } catch (cookieError) {
      console.error('[LOGIN] Failed to set auth cookie:', {
        error: cookieError instanceof Error ? cookieError.message : String(cookieError),
        stack: cookieError instanceof Error ? cookieError.stack : undefined,
      });
      return NextResponse.json(
        { error: 'Failed to create session', details: cookieError instanceof Error ? cookieError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    console.log('[LOGIN] Login successful for:', client.email);
    return NextResponse.json({
      success: true,
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        coach: client.coach,
        type: 'client',
      },
      redirect: '/user/dashboard',
    });
  } catch (error) {
    console.error('[LOGIN] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error,
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
