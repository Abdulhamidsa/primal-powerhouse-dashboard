import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Check for admin credentials (you can customize this)
    const adminEmail = 'admin@primalpower.com';
    const adminPassword = 'admin123'; // Change this to a secure password

    if (email.toLowerCase().trim() !== adminEmail || password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    // Create JWT token and set cookie for admin
    const response = NextResponse.json({
      success: true,
      user: {
        id: 'admin',
        name: 'Admin',
        email: adminEmail,
        type: 'admin',
      },
      redirect: '/admin/dashboard',
    });

    // Set auth cookie
    await AuthService.setAuthCookie({
      userId: 'admin',
      email: adminEmail,
      type: 'admin',
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
