import { PrismaClient } from '@prisma/client';

// Create a wrapper to handle TypeScript issues
const createPrismaWrapper = () => {
  const client = new PrismaClient();

  return client as any;
};

export const prisma = createPrismaWrapper();
