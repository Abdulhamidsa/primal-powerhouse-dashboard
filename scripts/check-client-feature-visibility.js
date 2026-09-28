const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const row = await prisma.clientFeatureVisibility.findFirst({ select: { id: true, clientId: true }, take: 1 });
    console.log('clientFeatureVisibility query successful. Sample row:', row);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('clientFeatureVisibility query failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
