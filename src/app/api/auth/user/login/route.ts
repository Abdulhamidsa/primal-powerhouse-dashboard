import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuthService, generateClientPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      rememberMe?: boolean;
    };

    const rawEmail = String(body.email ?? '');
    const rawPassword = String(body.password ?? '');
    const rememberMe = Boolean(body.rememberMe);

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword; // do not trim unless you want spaces ignored

    console.log('[USER LOGIN] input', {
      rawEmail: JSON.stringify(rawEmail),
      emailNormalized: email,
      rawEmailLen: rawEmail.length,
      passwordLen: rawPassword.length,
      origin: request.headers.get('origin'),
      ua: request.headers.get('user-agent'),
      ipHint: request.headers.get('x-forwarded-for'),
    });

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required', code: 'MISSING_FIELDS' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { email },
      include: { coach: { select: { name: true, email: true } } },
    });

    console.log('[USER LOGIN] client lookup', {
      found: Boolean(client),
      storedEmail: client?.email,
      storedEmailNormalized: client?.email ? client.email.trim().toLowerCase() : undefined,
      hasPassword: Boolean(client?.password),
    });

    if (!client) {
      return NextResponse.json({ error: 'Invalid email or password', code: 'EMAIL_NOT_FOUND' }, { status: 401 });
    }

    let isValidPassword = false;

    if (client.password) {
      isValidPassword = await AuthService.verifyPassword(password, client.password);
      console.log('[USER LOGIN] password check', { path: 'hashed', ok: isValidPassword });
    } else {
      const storedEmailNormalized = client.email.trim().toLowerCase();
      const defaultPassword = generateClientPassword(storedEmailNormalized);

      isValidPassword = password === defaultPassword;

      console.log('[USER LOGIN] password check', {
        path: 'default',
        ok: isValidPassword,
        storedEmailNormalized,
        passwordLen: password.length,
        defaultPasswordLen: defaultPassword.length,
      });

      if (isValidPassword) {
        const hashedPassword = await AuthService.hashPassword(password);
        await prisma.client.update({
          where: { id: client.id },
          data: { password: hashedPassword, email: storedEmailNormalized },
        });
      }
    }

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid email or password', code: 'PASSWORD_MISMATCH' }, { status: 401 });
    }

    const token = AuthService.generateToken({
      userId: client.id,
      email: client.email,
      type: 'client',
    });

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

    const response = NextResponse.json({
      success: true,
      user: { id: client.id, name: client.name, email: client.email, coach: client.coach },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error) {
    console.error('[USER LOGIN] error:', error);
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
