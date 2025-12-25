import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: { status: 'unknown', details: '' },
    env_variables: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    // Test database connection
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    checks.database.status = 'connected';
    checks.database.details = 'Database connection successful';

    return NextResponse.json({
      status: 'healthy',
      ...checks,
    });
  } catch (error) {
    checks.database.status = 'error';
    checks.database.details = error instanceof Error ? error.message : String(error);

    console.error('[HEALTH] Database health check failed:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        status: 'unhealthy',
        ...checks,
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
