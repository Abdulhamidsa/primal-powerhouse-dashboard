// This file is marked as server-only to prevent the Prisma client from being bundled for the browser
// Add the server-only directive
// @ts-ignore - This import is used by the Next.js compiler to mark this as a server-only module
import 'server-only';
import { PrismaClient } from '@prisma/client';

// Check if we're in a Node.js environment
const isServer = typeof window === 'undefined';

// Only create Prisma client on the server
let prismaInstance: PrismaClient | undefined;

if (isServer) {
  // PrismaClient is attached to the `global` object in development to prevent
  // exhausting your database connection limit.
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };

  // Use existing instance if available (dev mode) or create a new one
  prismaInstance =
    globalForPrisma.prisma ??
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      // Add connection pool limits to prevent too many connections
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  // Save instance to global in development
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance;
  }
}

// Export the prisma instance or throw a clear error if used in browser
export const prisma =
  prismaInstance ||
  (() => {
    throw new Error(
      'PrismaClient is not available in browser environments. This error typically happens when ' +
        'server code is used on the client. Make sure this module is only imported in server components ' +
        'or API routes.'
    );
  })();
