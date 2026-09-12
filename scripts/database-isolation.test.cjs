const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertDevelopmentDatabase } = require('./assert-development-database.cjs');
const prod = { DATABASE_URL: 'postgresql://prod:dummy@db.example/primal_prod' };
test('development must not target production', () => {
  assert.throws(() => assertDevelopmentDatabase({ ...prod, DIRECT_URL: prod.DATABASE_URL }, prod));
});
test('accepts isolated test database and shadow database', () => {
  assert.doesNotThrow(() => assertDevelopmentDatabase({ DATABASE_URL: 'postgresql://primal_test_user:dummy@db.example/primal_test', DIRECT_URL: 'postgresql://primal_test_user:dummy@db.example/primal_test', SHADOW_DATABASE_URL: 'postgresql://primal_test_user:dummy@db.example/primal_test_shadow' }, prod));
});
test('rejects mismatched direct connection and production shadow', () => {
  const dev = { DATABASE_URL: 'postgresql://primal_test_user:dummy@db.example/primal_test', DIRECT_URL: prod.DATABASE_URL };
  assert.throws(() => assertDevelopmentDatabase(dev, prod));
  assert.throws(() => assertDevelopmentDatabase({ ...dev, DIRECT_URL: dev.DATABASE_URL, SHADOW_DATABASE_URL: prod.DATABASE_URL }, prod));
});

test('rejects non-PostgreSQL URLs and a shadow on another host', () => {
  const url = 'postgresql://primal_test_user:dummy@db.example/primal_test';
  const dev = { DATABASE_URL: url, DIRECT_URL: url };
  assert.throws(() => assertDevelopmentDatabase({ ...dev, DATABASE_URL: url.replace('postgresql:', 'https:') }, prod));
  assert.throws(() => assertDevelopmentDatabase({ ...dev, SHADOW_DATABASE_URL: 'postgresql://primal_test_user:dummy@other.example/primal_test_shadow' }, prod));
});
