const fs = require('node:fs');
const dotenv = require('dotenv');

function assertDevelopmentDatabase(values, production) {
  const database = new URL(values.DATABASE_URL || 'missing:');
  const direct = new URL(values.DIRECT_URL || 'missing:');
  if (![database, direct].every(url => ['postgres:', 'postgresql:'].includes(url.protocol))) {
    throw new Error('Development requires PostgreSQL connection URLs.');
  }
  const name = decodeURIComponent(database.pathname.slice(1));
  if (name !== 'primal_test' || decodeURIComponent(database.username) !== 'primal_test_user') {
    throw new Error('Development requires primal_test with primal_test_user. Configure .env.dev; production credentials are not allowed.');
  }
  if (direct.hostname !== database.hostname || direct.pathname !== database.pathname || direct.username !== database.username) {
    throw new Error('DIRECT_URL must use the same development database and role as DATABASE_URL.');
  }
  if (production.DATABASE_URL) {
    const prod = new URL(production.DATABASE_URL);
    if (prod.hostname === database.hostname && prod.pathname === database.pathname) throw new Error('Development and production databases must be different.');
  }
  if (values.SHADOW_DATABASE_URL) {
    const shadow = new URL(values.SHADOW_DATABASE_URL);
    if (!['postgres:', 'postgresql:'].includes(shadow.protocol) || shadow.hostname !== database.hostname || shadow.pathname !== '/primal_test_shadow' || shadow.username !== database.username) throw new Error('Use primal_test_shadow on the development host with the development role for migrations.');
  }
}

module.exports = { assertDevelopmentDatabase };
if (require.main === module) {
  try {
    const values = dotenv.parse(fs.readFileSync('.env.dev'));
    const production = fs.existsSync('.env.prod') ? dotenv.parse(fs.readFileSync('.env.prod')) : {};
    // dotenv-cli does not override inherited variables by default. Check the effective configuration too.
    const effective = { ...values, ...Object.fromEntries(['DATABASE_URL', 'DIRECT_URL', 'SHADOW_DATABASE_URL'].filter(k => process.env[k]).map(k => [k, process.env[k]])) };
    assertDevelopmentDatabase(effective, production);
    if (process.argv.includes('--migration') && !effective.SHADOW_DATABASE_URL) throw new Error('Set a separate SHADOW_DATABASE_URL before development migrations.');
    console.log('Development database isolation check passed.');
  } catch (error) {
    console.error(error.message.startsWith('Development') || error.message.startsWith('Use ') || error.message.startsWith('DIRECT') || error.message.startsWith('Set ') ? error.message : 'Development database configuration is missing or invalid. Values withheld.');
    process.exitCode = 1;
  }
}
