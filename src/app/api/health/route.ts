import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version || '1.0.0';

  try {
    await prisma.$connect();
    return NextResponse.json({
      status: 'healthy',
      timestamp,
      version,
      database: { status: 'connected' },
    });
  } catch (error) {
    console.error('[HEALTH] Database health check failed:', error instanceof Error ? error.name : 'UnknownError');

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        version,
        database: { status: 'error' },
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
