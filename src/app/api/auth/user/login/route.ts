import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService, generateClientPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { coach: { select: { name: true, email: true } } },
    });

    if (!client) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let isValidPassword = false;

    if (client.password) {
      isValidPassword = await AuthService.verifyPassword(password, client.password);
    } else {
      const defaultPassword = generateClientPassword(client.email);
      isValidPassword = password === defaultPassword;

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

    await AuthService.setAuthCookie(
      { userId: client.id, email: client.email, type: 'client' },
      Boolean(rememberMe)
    );

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
    console.error('[LOGIN] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
