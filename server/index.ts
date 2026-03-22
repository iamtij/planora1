import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');
// Load .env from project root (reliable even if cwd is not the repo root)
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

function envStr(key: string): string | undefined {
  const v = process.env[key];
  return typeof v === 'string' ? v.trim() : undefined;
}

const { Pool } = pg;

const ADMIN_USERNAME = envStr('ADMIN_USERNAME');
const ADMIN_PASSWORD = envStr('ADMIN_PASSWORD');
const JWT_SECRET = envStr('ADMIN_JWT_SECRET');

function missingAdminEnvKeys(): string[] {
  const keys: string[] = [];
  if (!ADMIN_USERNAME) keys.push('ADMIN_USERNAME');
  if (!ADMIN_PASSWORD) keys.push('ADMIN_PASSWORD');
  if (!JWT_SECRET) keys.push('ADMIN_JWT_SECRET');
  return keys;
}

const DATABASE_URL = envStr('DATABASE_URL');
const API_PORT = Number(process.env.PORT ?? process.env.API_PORT) || 3001;

if (!DATABASE_URL) {
  console.error(
    'Missing DATABASE_URL. Copy .env.example to .env, run `npm run db:up`, and use port 5433 for Docker Postgres.'
  );
  process.exit(1);
}

function poolConfig(connectionString: string): ConstructorParameters<typeof Pool>[0] {
  const cfg: ConstructorParameters<typeof Pool>[0] = { connectionString };
  try {
    const u = new URL(connectionString.replace(/^postgresql:/i, 'http:'));
    if (u.hostname.endsWith('.rlwy.net')) {
      cfg.ssl = { rejectUnauthorized: false };
    }
  } catch {
    // ignore invalid URL
  }
  return cfg;
}

const pool = new Pool(poolConfig(DATABASE_URL));

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      type TEXT NOT NULL,
      inquiry TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS mobile TEXT;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
  `);
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '64kb' }));

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const missing = missingAdminEnvKeys();
  if (missing.length > 0) {
    res.status(503).json({ error: 'Admin auth not configured', missingEnv: missing });
    return;
  }
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/inquiries', async (req, res) => {
  const { name, email, type, inquiry, mobile } = req.body ?? {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof type !== 'string' ||
    typeof inquiry !== 'string'
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  if (mobile != null && typeof mobile !== 'string') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const trimmed = {
    name: name.trim(),
    email: email.trim(),
    type: type.trim(),
    inquiry: inquiry.trim(),
    mobile:
      typeof mobile === 'string' && mobile.trim() !== ''
        ? mobile.trim().slice(0, 40)
        : null,
  };

  if (!trimmed.name || !trimmed.email || !trimmed.type || !trimmed.inquiry) {
    res.status(400).json({ error: 'Name, email, project type, and inquiry are required' });
    return;
  }

  try {
    const result = await pool.query<{
      id: number;
      name: string;
      email: string;
      mobile: string | null;
      type: string;
      inquiry: string;
      created_at: string;
    }>(
      `INSERT INTO inquiries (name, email, mobile, type, inquiry)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, mobile, type, inquiry, created_at`,
      [trimmed.name, trimmed.email, trimmed.mobile, trimmed.type, trimmed.inquiry]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not save inquiry' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const missing = missingAdminEnvKeys();
  if (missing.length > 0) {
    res.status(503).json({ error: 'Admin not configured', missingEnv: missing });
    return;
  }
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }
  const u = username.trim();
  const p = password.trim();
  if (u !== ADMIN_USERNAME || p !== ADMIN_PASSWORD) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }
  const token = jwt.sign({ sub: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/api/admin/inquiries', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query<{
      id: number;
      name: string;
      email: string;
      mobile: string | null;
      type: string;
      inquiry: string;
      created_at: Date;
    }>(
      `SELECT id, name, email, mobile, type, inquiry, created_at
       FROM inquiries
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load inquiries' });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  console.warn(
    'No dist/ folder — run `npm run build` before start in production, or use `npm run dev` locally.'
  );
}

ensureSchema()
  .then(() => {
    app.listen(API_PORT, '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${API_PORT}`);
      const missing = missingAdminEnvKeys();
      if (missing.length === 0) {
        console.log('Admin login: enabled (POST /api/admin/login)');
      } else {
        console.warn(
          `Admin login: disabled — add these env vars on your host (e.g. Railway service Variables): ${missing.join(', ')}`
        );
      }
    });
  })
  .catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Failed to connect or migrate:', msg);
    if (msg.includes('role') && msg.includes('does not exist')) {
      console.error(
        'Your client is probably connecting to the wrong Postgres (often :5432 is Homebrew). Use DATABASE_URL with localhost:5433 and run `npm run db:up`, or set DATABASE_URL to your local superuser.'
      );
    }
    process.exit(1);
  });
