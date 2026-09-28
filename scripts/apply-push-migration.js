const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.dev' });

const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(
      'ALTER TABLE clients ADD COLUMN IF NOT EXISTS "consentMessageNotifications" BOOLEAN NOT NULL DEFAULT false',
    );
    console.log('Column consentMessageNotifications: OK');

    // Drop the incorrectly-named snake_case column if it was created
    await prisma.$executeRawUnsafe('ALTER TABLE clients DROP COLUMN IF EXISTS consent_message_notifications');
    console.log('Dropped stale snake_case column (if existed): OK');

    // Drop old table (wrong column names from first migration attempt) and recreate
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS push_subscriptions');

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT NOT NULL PRIMARY KEY,
        "clientId" TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT push_subscriptions_client_fk
          FOREIGN KEY ("clientId") REFERENCES clients(id) ON DELETE CASCADE,
        CONSTRAINT push_subscriptions_client_endpoint_unique
          UNIQUE ("clientId", endpoint)
      )
    `);
    await prisma.$executeRawUnsafe(
      'CREATE INDEX IF NOT EXISTS push_subscriptions_client_id_idx ON push_subscriptions("clientId")',
    );
    console.log('Table push_subscriptions: OK');
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
