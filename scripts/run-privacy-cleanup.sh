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

cleanup_script="$PRIMAL_APP_DIR/scripts/privacy-cleanup.js"
node_bin="${PRIMAL_NODE_BIN:-/usr/bin/node}"

if [[ ! -f "$cleanup_script" ]]; then
  echo 'Privacy cleanup script is missing from PRIMAL_APP_DIR' >&2
  exit 1
fi
if [[ ! -x "$node_bin" ]]; then
  echo 'Configured Node.js executable is missing or not executable' >&2
  exit 1
fi

if [[ -n "${PRIMAL_ENV_FILE:-}" && -f "$PRIMAL_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$PRIMAL_ENV_FILE"
  set +a
fi

cd "$PRIMAL_APP_DIR"
exec "$node_bin" "$cleanup_script" "$@"
