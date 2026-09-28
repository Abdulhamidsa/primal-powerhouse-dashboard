import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const backupScript = readFileSync(resolve(process.cwd(), 'scripts/backup-postgres.sh'), 'utf8');
const cleanupWrapper = readFileSync(resolve(process.cwd(), 'scripts/run-privacy-cleanup.sh'), 'utf8');

describe('host privacy operations scripts', () => {
  it('keeps PostgreSQL backups local, custom-format, validated, and bounded', () => {
    expect(backupScript).toContain("db_host=\"${PRIMAL_DB_HOST:-127.0.0.1}\"");
    expect(backupScript).toContain("if [[ \"$db_host\" != '127.0.0.1' ]]");
    expect(backupScript).toContain('pg_dump --format=custom');
    expect(backupScript).toContain('pg_restore --list');
    expect(backupScript).toContain('PRIMAL_BACKUP_RETENTION_COUNT:-14');
    expect(backupScript).toContain('PGPASSFILE');
    expect(backupScript).not.toContain('pnpm');
  });

  it('runs privacy cleanup through the configured direct Node executable', () => {
    expect(cleanupWrapper).toContain('node_bin="${PRIMAL_NODE_BIN:-/usr/bin/node}"');
    expect(cleanupWrapper).toContain('exec "$node_bin" "$cleanup_script" "$@"');
    expect(cleanupWrapper).not.toContain('pnpm privacy:cleanup');
  });
});
