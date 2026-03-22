#!/usr/bin/env bash
# Apply db/init.sql to Railway Postgres (uses RAILWAY_DATABASE_URL from .env).
# Legacy: if you still use PGPASSWORD + hardcoded host, use psql manually.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
exec node scripts/db-migrate.mjs railway
