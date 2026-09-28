#!/usr/bin/env bash
set -Eeuo pipefail

: "${PRIMAL_APP_DIR:?Set PRIMAL_APP_DIR to the deployed application directory}"
: "${PRIMAL_PM2_APP_NAME:?Set PRIMAL_PM2_APP_NAME to the existing PM2 process name}"
: "${PRIMAL_ENV_FILE:?Set PRIMAL_ENV_FILE to the protected production environment file}"

if [[ ! -d "$PRIMAL_APP_DIR" ]]; then
  echo "PRIMAL_APP_DIR does not exist: $PRIMAL_APP_DIR" >&2
  exit 1
fi
if [[ ! -f "$PRIMAL_APP_DIR/package.json" || ! -f "$PRIMAL_APP_DIR/pnpm-lock.yaml" ]]; then
  echo "PRIMAL_APP_DIR is not a pnpm application directory" >&2
  exit 1
fi
if [[ ! -f "$PRIMAL_ENV_FILE" ]]; then
  echo "PRIMAL_ENV_FILE does not exist" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$PRIMAL_ENV_FILE"
set +a
export NODE_ENV=production

cd "$PRIMAL_APP_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo 'PM2 is required for the canonical VPS deployment' >&2
  exit 1
fi
if ! pm2 describe "$PRIMAL_PM2_APP_NAME" >/dev/null 2>&1; then
  echo "PM2 process does not exist: $PRIMAL_PM2_APP_NAME" >&2
  echo 'Register the initial process explicitly before using this release wrapper.' >&2
  exit 1
fi

pnpm install --frozen-lockfile
pnpm ops:validate:production
pnpm exec prisma validate
pnpm exec prisma migrate status
pnpm exec prisma migrate deploy
pnpm exec prisma generate
pnpm legal:validate
pnpm build

pm2 reload "$PRIMAL_PM2_APP_NAME" --update-env

health_url="${PRIMAL_HEALTH_URL:-http://127.0.0.1:${PORT:-3000}/api/health}"
for _ in {1..30}; do
  if curl --fail --silent --show-error "$health_url" >/dev/null; then
    echo "PM2 deployment healthy: $PRIMAL_PM2_APP_NAME"
    exit 0
  fi
  sleep 2
done

echo 'PM2 deployment did not become healthy after reload' >&2
exit 1
