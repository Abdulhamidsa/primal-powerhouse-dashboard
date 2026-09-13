// Read-only connection audit. Never prints credentials, hosts, or client records.
const fs = require('node:fs');
const dotenv = require('dotenv');
const { assertDevelopmentDatabase } = require('./assert-development-database.cjs');

async function main() {
  const values = dotenv.parse(fs.readFileSync('.env.dev'));
  const production = dotenv.parse(fs.readFileSync('.env.prod'));
  const keys = ['DATABASE_URL', 'DIRECT_URL', 'SHADOW_DATABASE_URL'];
  const effective = { ...values, ...Object.fromEntries(keys.filter(key => process.env[key]).map(key => [key, process.env[key]])) };
  assertDevelopmentDatabase(effective, production);
  const url = new URL(effective.DIRECT_URL);
  url.searchParams.set('connect_timeout', '10');
  // Prisma imports may load .env. Validate inherited values before that happens,
  // and always pass the verified development URL explicitly.
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } });
  try {
    const report = await db.$transaction(async tx => {
      await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY');
      const identity = await tx.$queryRaw`SELECT current_database() AS database, current_user AS role`;
      const shadow = await tx.$queryRaw`SELECT datname AS database, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname = 'primal_test_shadow'`;
      const role = await tx.$queryRaw`SELECT rolcreatedb AS can_create_database FROM pg_roles WHERE rolname = current_user`;
      const schema = await tx.$queryRaw`SELECT count(*)::int AS table_count FROM information_schema.tables WHERE table_schema = 'public'`;
      return { identity: identity[0], shadow: shadow[0] || null, role: role[0], schema: schema[0] };
    });
    console.log(JSON.stringify(report, null, 2));
    if (!report.shadow || !effective.SHADOW_DATABASE_URL) {
      console.log('Shadow database setup is incomplete. Development migrations remain blocked.');
      process.exitCode = 1;
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch(error => {
  console.error(`Development database audit failed (${error.code || 'configuration/connection'}). Connection values withheld.`);
  process.exitCode = 1;
});
