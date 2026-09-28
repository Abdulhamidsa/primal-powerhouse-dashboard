const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const client = await prisma.client.findFirst({ select: { id: true }, take: 1 });
    console.log('Query successful. Sample client:', client);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Prisma query failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
