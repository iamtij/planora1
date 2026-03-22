/**
 * Verifies DATABASE_URL connects and the inquiries table exists.
 * Usage: npm run db:check
 */
import 'dotenv/config';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL. Copy .env.example to .env.');
  process.exit(1);
}

function poolConfig(connectionString) {
  const cfg = { connectionString };
  try {
    const u = new URL(connectionString.replace(/^postgresql:/i, 'http:'));
    if (u.hostname.endsWith('.rlwy.net')) {
      cfg.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // ignore
  }
  return cfg;
}

const pool = new pg.Pool(poolConfig(url));
try {
  const ping = await pool.query('SELECT NOW() AS now, current_database() AS db');
  console.log('Connected:', { db: ping.rows[0].db, now: ping.rows[0].now });

  const cols = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'inquiries'
     ORDER BY ordinal_position`
  );
  if (cols.rows.length === 0) {
    console.warn('Table "inquiries" not found yet — start the API once (it runs migrations) or re-run db/init.sql.');
  } else {
    console.log('Table inquiries:', cols.rows.map((r) => r.column_name).join(', '));
  }
  console.log('Database check OK.');
} catch (err) {
  const detail =
    err instanceof Error && err.message
      ? err.message
      : err instanceof AggregateError
        ? err.errors?.map((e) => (e instanceof Error ? e.message : String(e))).join('; ')
        : String(err);
  console.error('Database check failed:', detail || err);
  console.error(
    'Tip: run `docker compose up -d --wait` and ensure DATABASE_URL uses port 5433 (Docker) unless you use your own Postgres.'
  );
  process.exit(1);
} finally {
  await pool.end();
}
