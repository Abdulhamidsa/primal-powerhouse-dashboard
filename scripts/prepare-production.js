// Prepare schema for production deployment
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing for production deployment...');
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- VERCEL:', process.env.VERCEL);
console.log('- VERCEL_ENV:', process.env.VERCEL_ENV);
console.log('- DATABASE_URL includes postgres:', process.env.DATABASE_URL?.includes('postgres'));

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Check if we're in production environment
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.env.VERCEL === '1' ||
  process.env.VERCEL_ENV ||
  process.env.DATABASE_URL?.includes('postgres');

if (isProduction) {
  console.log('📦 Setting up PostgreSQL for production...');

  // Replace SQLite with PostgreSQL
  schemaContent = schemaContent.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');

  // Write the updated schema
  fs.writeFileSync(schemaPath, schemaContent);
  console.log('✅ Schema updated for PostgreSQL');
} else {
  console.log('🛠️ Using SQLite for local development');
}

// Generate Prisma client
const { execSync } = require('child_process');
try {
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Run migrations in production with timeout
  if (isProduction && process.env.DATABASE_URL) {
    console.log('🔄 Running database migrations...');
    try {
      // Use direct connection for migrations (not pooled)
      let migrationUrl = process.env.DATABASE_URL;

      // If using pgbouncer, switch to direct connection for migrations
      if (migrationUrl.includes('pgbouncer=true') || migrationUrl.includes(':6543')) {
        console.log('⚠️  Detected connection pooler - switching to direct connection for migrations');
        migrationUrl = migrationUrl
          .replace(':6543', ':5432') // Use direct port instead of pgbouncer
          .replace('?pgbouncer=true', '')
          .replace('&pgbouncer=true', '');
      }

      // Set timeout of 30 seconds for migrations
      execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        timeout: 30000,
        env: { ...process.env, DATABASE_URL: migrationUrl },
      });
      console.log('✅ Database migrations applied');
    } catch (migrateError) {
      console.warn('⚠️  Migration failed or timed out:', migrateError.message);
      console.log('Note: Continuing with build. You may need to run migrations manually.');
      console.log('Run: npx prisma migrate deploy');
    }
  }
} catch (error) {
  console.error('❌ Error during preparation:', error.message);
  process.exit(1);
}
