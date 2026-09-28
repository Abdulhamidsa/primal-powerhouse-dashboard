// scripts/prepare-production.js
const path = require('path');
const { execSync } = require('child_process');

process.chdir(path.join(__dirname, '..'));

require('dotenv').config({
  path: path.join(process.cwd(), '.env'),
});

const isProduction = process.env.NODE_ENV === 'production';

console.log(
  JSON.stringify({
    event: 'production.prepare.started',
    nodeEnv: process.env.NODE_ENV ?? null,
    databaseConfigured: Boolean(process.env.DATABASE_URL),
  }),
);

if (isProduction && !process.env.DATABASE_URL) {
  console.error(JSON.stringify({ event: 'production.prepare.failed', reason: 'missing_database_url' }));
  process.exit(1);
}

try {
  execSync('pnpm exec prisma generate', { stdio: 'inherit' });

  if (isProduction) {
    execSync('pnpm exec prisma migrate deploy', { stdio: 'inherit' });
  }

  console.log(
    JSON.stringify({
      event: 'production.prepare.completed',
      migrationsApplied: isProduction,
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'production.prepare.failed',
      error: error instanceof Error ? error.name : 'Error',
    }),
  );
  process.exit(1);
}
