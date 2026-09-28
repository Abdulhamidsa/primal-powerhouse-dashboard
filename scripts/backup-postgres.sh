#!/usr/bin/env bash
set -Eeuo pipefail

run_id="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || date -u +%Y%m%dT%H%M%SZ)"
started_epoch="$(date +%s)"
phase='initialization'
tmp_file=''
backup_file=''

json_failure() {
  local status="$1"
  local duration=$(( $(date +%s) - started_epoch ))
  if [[ -n "$tmp_file" && -e "$tmp_file" ]]; then
    rm -f -- "$tmp_file" || true
  fi
  printf '{"event":"primal.postgres_backup.failed","runId":"%s","phase":"%s","durationSeconds":%s,"exitStatus":%s}\n' \
    "$run_id" "$phase" "$duration" "$status" >&2
}

on_exit() {
  local status=$?
  if (( status != 0 )); then
    json_failure "$status"
  fi
}
trap on_exit EXIT

backup_dir="${PRIMAL_BACKUP_DIR:-/var/backups/primal-powerhouse/postgresql}"
retention_count="${PRIMAL_BACKUP_RETENTION_COUNT:-14}"
db_host="${PRIMAL_DB_HOST:-127.0.0.1}"
db_port="${PRIMAL_DB_PORT:-5432}"
db_name="${PRIMAL_DB_NAME:-primal_prod}"
db_user="${PRIMAL_DB_USER:-primal_prod_user}"
pgpassfile="${PRIMAL_PGPASSFILE:-/etc/primal/postgres-backup.pgpass}"

if [[ "$db_host" != '127.0.0.1' ]]; then
  echo 'PostgreSQL backup requires PRIMAL_DB_HOST=127.0.0.1' >&2
  exit 1
fi
if [[ "$db_port" != '5432' || "$db_name" != 'primal_prod' || "$db_user" != 'primal_prod_user' ]]; then
  echo 'PostgreSQL backup configuration does not match the verified production database' >&2
  exit 1
fi
if [[ ! "$retention_count" =~ ^[1-9][0-9]*$ ]]; then
  echo 'PRIMAL_BACKUP_RETENTION_COUNT must be a positive integer' >&2
  exit 1
fi
if [[ ! -d "$backup_dir" || ! -w "$backup_dir" ]]; then
  echo 'Backup directory must already exist and be writable' >&2
  exit 1
fi
if [[ "$(stat -c '%u' "$backup_dir")" != '0' || "$(stat -c '%a' "$backup_dir")" != '700' ]]; then
  echo 'Backup directory must be root-owned with mode 0700' >&2
  exit 1
fi
if [[ ! -f "$pgpassfile" || "$(stat -c '%u' "$pgpassfile")" != '0' || "$(stat -c '%a' "$pgpassfile")" != '600' ]]; then
  echo 'PostgreSQL password file must be root-owned with mode 0600' >&2
  exit 1
fi
command -v pg_dump >/dev/null 2>&1
command -v pg_restore >/dev/null 2>&1

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="$backup_dir/${db_name}-${timestamp}.dump"
tmp_file="$backup_file.tmp.$run_id"

phase='dump'
PGHOST="$db_host" PGPORT="$db_port" PGDATABASE="$db_name" PGUSER="$db_user" PGPASSFILE="$pgpassfile" \
  pg_dump --format=custom --no-owner --no-privileges --file="$tmp_file"

phase='archive-validation'
pg_restore --list "$tmp_file" >/dev/null

phase='publish'
mv -- "$tmp_file" "$backup_file"
tmp_file=''

phase='retention'
mapfile -t old_backups < <(
  find "$backup_dir" -maxdepth 1 -type f -name "${db_name}-*.dump" -printf '%T@ %p\n' |
    sort -rn |
    tail -n +$((retention_count + 1)) |
    cut -d' ' -f2-
)
for old_backup in "${old_backups[@]}"; do
  rm -f -- "$old_backup"
done

phase='completed'
duration=$(( $(date +%s) - started_epoch ))
printf '{"event":"primal.postgres_backup.completed","runId":"%s","database":"%s","backupFile":"%s","retentionCount":%s,"durationSeconds":%s}\n' \
  "$run_id" "$db_name" "$(basename "$backup_file")" "$retention_count" "$duration"
trap - EXIT
