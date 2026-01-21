// scripts/prepare-production.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

process.chdir(path.join(__dirname, '..'));

require('dotenv').config({
  path: path.join(process.cwd(), '.env'),
});

console.log('🔧 Preparing for production deployment...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('- DATABASE_URL includes postgres:', process.env.DATABASE_URL?.includes('postgres'));

const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
const originalSchema = fs.readFileSync(schemaPath, 'utf8');

const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  !!process.env.VERCEL_ENV ||
  !!process.env.DATABASE_URL?.includes('postgres');

let effectiveSchema = originalSchema;

if (isProduction) {
  console.log('📦 Using PostgreSQL schema for production...');
  effectiveSchema = originalSchema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
} else {
  console.log('🛠️ Using SQLite for local development');
}

const tempSchemaPath = path.join(process.cwd(), 'prisma', 'schema.build.prisma');

try {
  fs.writeFileSync(tempSchemaPath, effectiveSchema);

  execSync(`pnpm exec prisma generate --schema=${tempSchemaPath}`, { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  if (isProduction && process.env.DATABASE_URL) {
    console.log('🔄 Running database migrations...');

    let migrationUrl = process.env.DATABASE_URL;

    if (migrationUrl.includes('pgbouncer=true') || migrationUrl.includes(':6543')) {
      console.log('⚠️  Detected connection pooler - switching to direct connection for migrations');
      migrationUrl = migrationUrl
        .replace(':6543', ':5432')
        .replace('?pgbouncer=true', '')
        .replace('&pgbouncer=true', '');
    }

    try {
      execSync('pnpm exec prisma migrate deploy', {
        stdio: 'inherit',
        timeout: 30000,
        env: { ...process.env, DATABASE_URL: migrationUrl },
      });
      console.log('✅ Database migrations applied');
    } catch (migrateError) {
      console.warn('⚠️  Migration failed or timed out:', migrateError.message);
      console.log('Note: Continuing with build. You may need to run migrations manually.');
      console.log('Run: pnpm exec prisma migrate deploy');
    }
  }
} catch (error) {
  console.error('❌ Error during preparation:', error.message);
  process.exit(1);
} finally {
  try {
    if (fs.existsSync(tempSchemaPath)) fs.unlinkSync(tempSchemaPath);
  } catch (_cleanupError) {
    // ignore cleanup failures
  }
}
