import { PrismaClient } from "@prisma/client";

// Create a wrapper to handle TypeScript issues
const createPrismaWrapper = () => {
  const client = new PrismaClient();

  // @ts-expect-error - Prisma client type issues in production
  return client as any;
};

export const prisma = createPrismaWrapper();
