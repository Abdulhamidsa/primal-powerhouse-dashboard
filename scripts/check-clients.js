const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const clients = await prisma.client.findMany({ take: 3, select: { id: true, dailyCheckinsEnabled: true, weeklyCheckinsEnabled: true, dailyWeightEnabled: true } });
    console.log('Clients query successful. Sample:', clients);
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Clients query failed:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
})();
