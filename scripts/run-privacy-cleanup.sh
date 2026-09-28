#!/usr/bin/env bash
set -Eeuo pipefail

operations_env="${PRIMAL_OPERATIONS_ENV_FILE:-/etc/primal/operations.env}"
if [[ -f "$operations_env" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$operations_env"
  set +a
fi

: "${PRIMAL_APP_DIR:?Set PRIMAL_APP_DIR in /etc/primal/operations.env}"

if [[ -n "${PRIMAL_ENV_FILE:-}" && -f "$PRIMAL_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$PRIMAL_ENV_FILE"
  set +a
fi

cd "$PRIMAL_APP_DIR"
exec pnpm privacy:cleanup -- "$@"
