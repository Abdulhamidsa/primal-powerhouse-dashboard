#!/usr/bin/env node
/**
 * Auto-configure Prisma schema based on DATABASE_URL
 * - Local (.env.local): SQLite (file:./dev.db)
 * - Production (Vercel env): PostgreSQL (postgres://...)
 */

const fs = require('fs');
const path = require('path');

// Load .env.local first (local override), then .env (fallback)
const envLocalPath = path.join(__dirname, '..', '.env.local');
const envPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

const isSQLite = databaseUrl.startsWith('file:');
const provider = isSQLite ? 'sqlite' : 'postgresql';

console.log(`🔄 Configuring Prisma for ${provider.toUpperCase()}...`);
console.log(`📝 DATABASE_URL: ${databaseUrl.substring(0, 50)}...`);

let schema = fs.readFileSync(schemaPath, 'utf8');

// Update provider
const oldProvider = schema.match(/provider\s*=\s*"(sqlite|postgresql)"/)?.[1];
if (oldProvider !== provider) {
  console.log(`   Changing provider from ${oldProvider} to ${provider}`);
  schema = schema.replace(/provider\s*=\s*"(sqlite|postgresql)"/, `provider = "${provider}"`);
}

// Add/remove relationMode based on provider
if (isSQLite) {
  // Remove relationMode for SQLite
  if (schema.includes('relationMode')) {
    schema = schema.replace(/\s*relationMode\s*=\s*"prisma"\s*\n?/g, '\n');
    console.log('   Removed relationMode for SQLite');
  }
} else {
  // Ensure relationMode for PostgreSQL
  if (!schema.includes('relationMode')) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/,
      'url      = env("DATABASE_URL")\n  relationMode = "prisma"'
    );
    console.log('   Added relationMode for PostgreSQL');
  }
}

fs.writeFileSync(schemaPath, schema);
console.log(`✅ Prisma configured for ${provider.toUpperCase()}`);
