const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.dev' });

const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS notification_delivery_logs (
        id TEXT NOT NULL PRIMARY KEY,
        "clientId" TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        "subscriptionCount" INTEGER NOT NULL DEFAULT 0,
        "successCount" INTEGER NOT NULL DEFAULT 0,
        "failureCount" INTEGER NOT NULL DEFAULT 0,
        "staleCount" INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        "payloadJson" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT notification_delivery_logs_client_fk
          FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE
      )
    `);

    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS notification_delivery_logs_client_created_idx ON notification_delivery_logs("clientId", "createdAt")',
    );
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS notification_delivery_logs_source_created_idx ON notification_delivery_logs(source, "createdAt")',
    );

    console.log('Table notification_delivery_logs: OK');
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});