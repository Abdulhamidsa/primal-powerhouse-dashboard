// Development-only deploy with preservation checks for every pre-existing table.
const fs = require('node:fs');
const crypto = require('node:crypto');
const dotenv = require('dotenv');
const { spawnSync } = require('node:child_process');
const { assertDevelopmentDatabase } = require('./assert-development-database.cjs');

async function main() {
  const values = dotenv.parse(fs.readFileSync('.env.dev'));
  const production = dotenv.parse(fs.readFileSync('.env.prod'));
  const keys = ['DATABASE_URL', 'DIRECT_URL', 'SHADOW_DATABASE_URL'];
  const effective = {
    ...values,
    ...Object.fromEntries(keys.filter(key => process.env[key]).map(key => [key, process.env[key]])),
  };
  assertDevelopmentDatabase(effective, production);
  if (!effective.SHADOW_DATABASE_URL) throw new Error('Missing shadow connection');
  const { PrismaClient } = require('@prisma/client');
  const connect = () => new PrismaClient({ datasources: { db: { url: effective.DIRECT_URL } } });
  const quote = name => '"' + name.replaceAll('"', '""') + '"';
  async function fingerprint(db, table, columns) {
    // Only hashes leave PostgreSQL; no existing personal data is exported.
    const rows = await db.$queryRawUnsafe(
      `SELECT count(*)::int AS count, md5(COALESCE(string_agg(row_hash, ',' ORDER BY row_hash), '')) AS digest FROM (SELECT md5(row_to_json(r)::text) AS row_hash FROM (SELECT ${columns.map(quote).join(',')} FROM public.${quote(table)}) r) h`,
    );
    return rows[0];
  }
  const db = connect();
  const before = [];
  try {
    const migrations =
      await db.$queryRaw`SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
    for (const migration of migrations) {
      const sql = fs.readFileSync(`prisma/migrations/${migration.migration_name}/migration.sql`);
      if (crypto.createHash('sha256').update(sql).digest('hex') !== migration.checksum)
        throw new Error('Historical migration checksum mismatch');
    }
    const columns =
      await db.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name <> '_prisma_migrations' ORDER BY table_name, ordinal_position`;
    for (const table of [...new Set(columns.map(row => row.table_name))]) {
      const names = columns.filter(row => row.table_name === table).map(row => row.column_name);
      before.push({ table, columns: names, fingerprint: await fingerprint(db, table, names) });
    }
  } finally {
    await db.$disconnect();
  }

  const args = ['node_modules/prisma/build/index.js', 'migrate'];
  const options = { env: { ...process.env, ...effective }, encoding: 'utf8' };
  const replay = spawnSync(
    process.execPath,
    [
      ...args,
      'diff',
      '--from-migrations',
      'prisma/migrations',
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--shadow-database-url',
      effective.SHADOW_DATABASE_URL,
      '--exit-code',
    ],
    options,
  );
  if (replay.status !== 0) throw new Error('Shadow replay or schema comparison failed');
  console.log('Shadow replay matches the current schema. Historical checksums verified.');
  const deploy = spawnSync(process.execPath, [...args, 'deploy'], options);
  if (deploy.status !== 0) throw new Error('Development migration failed; inspect migration status before retrying');

  const after = connect();
  try {
    for (const entry of before) {
      const current = await fingerprint(after, entry.table, entry.columns);
      if (JSON.stringify(current) !== JSON.stringify(entry.fingerprint))
        throw new Error('Existing table preservation check failed');
    }
    console.log(
      `Development migrations applied. All ${before.length} pre-existing tables retain their original rows and column values.`,
    );
  } finally {
    await after.$disconnect();
  }
}

main().catch(error => {
  const safe = /^(Missing shadow|Historical migration|Shadow replay|Development migration|Existing table)/.test(
    error.message,
  );
  console.error(safe ? error.message : 'Development migration stopped. Connection details withheld.');
  process.exitCode = 1;
});
