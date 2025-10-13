import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService, generateClientPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Find client by email
    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        coach: {
          select: { name: true, email: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Check if client has a password set
    let isValidPassword = false;

    if (client.password) {
      // Client has a stored password, verify it
      isValidPassword = await AuthService.verifyPassword(password, client.password);
    } else {
      // Client doesn't have a password yet, check against generated default
      const defaultPassword = generateClientPassword(client.email);
      isValidPassword = password === defaultPassword;

      // If valid, hash and store the password for future use
      if (isValidPassword) {
        const hashedPassword = await AuthService.hashPassword(password);
        await prisma.client.update({
          where: { id: client.id },
          data: { password: hashedPassword },
        });
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create JWT token and set cookie
    await AuthService.setAuthCookie({
      userId: client.id,
      email: client.email,
      type: 'client',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: client.id,
        name: client.name,
        email: client.email,
        coach: client.coach,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
