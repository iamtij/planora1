/**
 * Apply db/init.sql + idempotent ALTERs. Use:
 *   npm run db:migrate:local    → DATABASE_URL (e.g. Docker localhost:5433)
 *   npm run db:migrate:railway  → RAILWAY_DATABASE_URL (Railway Postgres URL from dashboard)
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = (process.argv[2] || 'local').toLowerCase();
const isRailway = target === 'railway';

const url = isRailway ? process.env.RAILWAY_DATABASE_URL : process.env.DATABASE_URL;

if (!url || typeof url !== 'string' || !url.trim()) {
  const key = isRailway ? 'RAILWAY_DATABASE_URL' : 'DATABASE_URL';
  console.error(`Missing ${key}. Copy .env.example to .env and set the connection string.`);
  process.exit(1);
}

/** Strip accidental quotes from .env lines */
function normalizeConnectionString(s) {
  return s.trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Parse postgresql://user:password@host:port/db without `new URL()` so passwords
 * may contain @, :, etc. (pg-connection-string uses URL() and can throw Invalid URL).
 */
function parsePostgresUrl(conn) {
  const s = normalizeConnectionString(conn);
  const m = s.match(/^postgres(ql)?:\/\//i);
  if (!m) {
    throw new Error('Connection string must start with postgres:// or postgresql://');
  }
  const rest = s.slice(m[0].length);
  const at = rest.lastIndexOf('@');
  if (at === -1) {
    throw new Error('Invalid connection string (expected user:password@host...)');
  }
  const auth = rest.slice(0, at);
  const hostPart = rest.slice(at + 1);
  const colon = auth.indexOf(':');
  if (colon === -1) {
    throw new Error('Invalid connection string (expected user:password)');
  }
  const user = decodeURIComponent(auth.slice(0, colon));
  const password = decodeURIComponent(auth.slice(colon + 1));
  const slash = hostPart.indexOf('/');
  if (slash === -1) {
    throw new Error('Invalid connection string (missing /database)');
  }
  const hostPort = hostPart.slice(0, slash);
  const database = hostPart.slice(slash + 1).split('?')[0];
  const hp = hostPort.split(':');
  const host = hp[0];
  const port = hp[1] ? parseInt(hp[1], 10) : 5432;
  return { user, password, host, port, database };
}

function poolConfig(connectionString) {
  const conn = normalizeConnectionString(connectionString);
  const cfg = { connectionString: conn };
  if (/\.rlwy\.net/i.test(conn) || /railway\.app/i.test(conn)) {
    cfg.ssl = { rejectUnauthorized: false };
  }
  return cfg;
}

const connNorm = normalizeConnectionString(url);
let pool;
if (isRailway) {
  const p = parsePostgresUrl(connNorm);
  pool = new pg.Pool({
    user: p.user,
    password: p.password,
    host: p.host,
    port: p.port,
    database: p.database,
    ssl: /\.rlwy\.net/i.test(p.host) || /railway\.app/i.test(p.host) ? { rejectUnauthorized: false } : undefined,
  });
} else {
  pool = new pg.Pool(poolConfig(url));
}
const initSql = fs.readFileSync(path.join(__dirname, '../db/init.sql'), 'utf8');

try {
  await pool.query(initSql);
  await pool.query('ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS mobile TEXT;');
  console.log(`Migration OK (${isRailway ? 'Railway' : 'local'}).`);
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('Migration failed:', msg);
  if (isRailway && /ENOTFOUND|ECONNREFUSED/i.test(msg)) {
    console.error(
      'Tip: set RAILWAY_DATABASE_URL in .env to the real Postgres URL from Railway (Postgres service → Connect / Variables). Replace placeholders like YOUR_RAILWAY_HOST or YOUR_PASSWORD.'
    );
  }
  process.exit(1);
} finally {
  await pool.end();
}
