#!/usr/bin/env bash
# Apply db/init.sql to Railway Postgres.
# Set PGPASSWORD or RAILWAY_PGPASSWORD (e.g. from Railway dashboard → Postgres → Variables).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PGPASSWORD="${RAILWAY_PGPASSWORD:-${PGPASSWORD:-}}"
if [[ -z "${PGPASSWORD:-}" ]]; then
  echo "Set PGPASSWORD or RAILWAY_PGPASSWORD to your Railway Postgres password." >&2
  exit 1
fi
psql -h caboose.proxy.rlwy.net -U postgres -p 49447 -d railway -f "$ROOT/db/init.sql"
