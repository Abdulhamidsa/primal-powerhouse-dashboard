const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const buildTsconfig = '.cache/mobile/tsconfig.next-build.json';
fs.mkdirSync('.cache/mobile', { recursive: true });
fs.writeFileSync(buildTsconfig, `${JSON.stringify({ extends: '../../tsconfig.json' }, null, 2)}\n`);
// Build with deliberately unusable local database endpoints. Never touch production during verification.
const env = { ...process.env, DATABASE_URL: 'postgresql://build_only:unused@127.0.0.1:1/build_only', DIRECT_URL: 'postgresql://build_only:unused@127.0.0.1:1/build_only', SHADOW_DATABASE_URL: 'postgresql://build_only:unused@127.0.0.1:1/build_shadow', JWT_SECRET: 'build-only-placeholder-not-for-production-123456789', NEXT_DIST_DIR: '.cache/mobile/next-build', NEXT_TSCONFIG_PATH: buildTsconfig, NEXT_TELEMETRY_DISABLED: '1' };
const result = spawnSync(process.execPath, [require.resolve('next/dist/bin/next'), 'build'], { env, stdio: 'inherit' });
process.exitCode = result.status ?? 1;
