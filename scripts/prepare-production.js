// Prepare schema for production deployment
const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing for production deployment...');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

if (isProduction) {
  console.log('📦 Setting up PostgreSQL for production...');
  
  // Replace SQLite with PostgreSQL
  schemaContent = schemaContent.replace(
    /provider\s*=\s*"sqlite"/g,
    'provider = "postgresql"'
  );
  
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
} catch (error) {
  console.error('❌ Failed to generate Prisma client:', error.message);
  process.exit(1);
}