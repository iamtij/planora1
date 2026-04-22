import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import {
  ALLOWED_SLOT_INTERVALS,
  generateTimeSlots,
  isBundlePreferenceId,
  manilaTodayYmd,
  normalizeTimeToHHMM,
} from './studioSettings.ts';
import {
  notifyAdminNewInquiry,
  notifyUserInquiryReceived,
  notifyUserBookingApproved,
  notifyUserBookingCancelled,
} from './mail.ts';

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
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS visit_date DATE;
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS visit_time TIME;
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS bundle_preference TEXT;
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS prc_number TEXT;
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
  `);
  await pool.query(`
    ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS studio_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      day_start TIME NOT NULL DEFAULT '09:00',
      day_end TIME NOT NULL DEFAULT '18:00',
      slot_interval_minutes INTEGER NOT NULL DEFAULT 30
    );
  `);
  await pool.query(`
    ALTER TABLE studio_settings DROP CONSTRAINT IF EXISTS studio_settings_id_check;
  `);
  await pool.query(`CREATE SEQUENCE IF NOT EXISTS studio_settings_id_seq;`);
  await pool.query(`
    ALTER TABLE studio_settings
    ALTER COLUMN id SET DEFAULT nextval('studio_settings_id_seq');
  `);
  await pool.query(`
    ALTER TABLE studio_settings ADD COLUMN IF NOT EXISTS name TEXT;
  `);
  await pool.query(`
    UPDATE studio_settings
    SET name = COALESCE(NULLIF(TRIM(name), ''), 'Default Template')
    WHERE name IS NULL OR TRIM(name) = '';
  `);
  await pool.query(`
    ALTER TABLE studio_settings ALTER COLUMN name SET NOT NULL;
  `);
  await pool.query(`
    ALTER TABLE studio_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'studio_settings_name_unique'
      ) THEN
        ALTER TABLE studio_settings
          ADD CONSTRAINT studio_settings_name_unique UNIQUE (name);
      END IF;
    END $$;
  `);
  await pool.query(`
    INSERT INTO studio_settings (id, name, day_start, day_end, slot_interval_minutes)
    SELECT 1, 'Default Template', '09:00'::time, '18:00'::time, 30
    WHERE NOT EXISTS (SELECT 1 FROM studio_settings);
  `);
  await pool.query(`
    SELECT setval(
      'studio_settings_id_seq',
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM studio_settings), 1),
      true
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS studio_bookable_slots (
      id SERIAL PRIMARY KEY,
      slot_date DATE NOT NULL,
      slot_time TIME NOT NULL,
      UNIQUE (slot_date, slot_time)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_studio_bookable_slots_date ON studio_bookable_slots (slot_date);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
  `);
}

type StudioTemplate = {
  id: number;
  name: string;
  dayStart: string;
  dayEnd: string;
  slotIntervalMinutes: number;
};

async function loadStudioTemplates(): Promise<StudioTemplate[]> {
  const result = await pool.query<{
    id: number;
    name: string;
    ds: string;
    de: string;
    slot_interval_minutes: number;
  }>(
    `SELECT id,
            name,
            to_char(day_start, 'HH24:MI') AS ds,
            to_char(day_end, 'HH24:MI') AS de,
            slot_interval_minutes
     FROM studio_settings
     ORDER BY id ASC`
  );
  return result.rows.map((row) => ({
    id: row.id,
    name: row.name,
    dayStart: normalizeTimeToHHMM(row.ds),
    dayEnd: normalizeTimeToHHMM(row.de),
    slotIntervalMinutes: row.slot_interval_minutes,
  }));
}

async function loadStudioTemplateById(id: number): Promise<StudioTemplate | null> {
  const result = await pool.query<{
    id: number;
    name: string;
    ds: string;
    de: string;
    slot_interval_minutes: number;
  }>(
    `SELECT id,
            name,
            to_char(day_start, 'HH24:MI') AS ds,
            to_char(day_end, 'HH24:MI') AS de,
            slot_interval_minutes
     FROM studio_settings
     WHERE id = $1`,
    [id]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    dayStart: normalizeTimeToHHMM(row.ds),
    dayEnd: normalizeTimeToHHMM(row.de),
    slotIntervalMinutes: row.slot_interval_minutes,
  };
}

/** Bookable HH:MM slots for a calendar day (Asia/Manila business dates stored as DATE). */
async function loadBookableSlotsForDate(dateYmd: string): Promise<string[]> {
  const r = await pool.query<{ t: string }>(
    `SELECT to_char(slot_time, 'HH24:MI') AS t
     FROM studio_bookable_slots
     WHERE slot_date = $1::date
     ORDER BY slot_time`,
    [dateYmd]
  );
  return r.rows.map((row) => normalizeTimeToHHMM(row.t));
}

function parseHHMM(s: string): { ok: true; minutes: number } | { ok: false } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim());
  if (!m) return { ok: false };
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return { ok: false };
  return { ok: true, minutes: h * 60 + min };
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

/** Public: slots for the selected visit date only (admin must add date + times). Query: date=YYYY-MM-DD */
app.get('/api/studio/settings', async (req, res) => {
  const date = req.query.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: 'Query date=YYYY-MM-DD is required' });
    return;
  }
  const todayManila = manilaTodayYmd();
  if (date < todayManila) {
    res.status(400).json({ error: 'Date cannot be in the past' });
    return;
  }
  try {
    const approved = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS(
         SELECT 1
         FROM inquiries
         WHERE visit_date = $1::date
           AND status = 'approved'
       ) AS exists`,
      [date]
    );
    if (approved.rows[0]?.exists) {
      res.json({ slots: [] });
      return;
    }
    const slots = await loadBookableSlotsForDate(date);
    res.json({ slots });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load availability' });
  }
});

/** Public: YYYY-MM-DD values that have at least one bookable slot (today onward, Manila calendar). */
app.get('/api/studio/available-dates', async (_req, res) => {
  const todayManila = manilaTodayYmd();
  try {
    const result = await pool.query<{ d: string }>(
      `SELECT DISTINCT slot_date::text AS d
       FROM studio_bookable_slots
       WHERE slot_date >= $1::date
         AND NOT EXISTS (
           SELECT 1
           FROM inquiries i
           WHERE i.visit_date = studio_bookable_slots.slot_date
             AND i.status = 'approved'
         )
       ORDER BY d ASC`,
      [todayManila]
    );
    res.json({ dates: result.rows.map((r) => r.d) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load available dates' });
  }
});

app.get('/api/admin/studio-templates', requireAdmin, async (_req, res) => {
  try {
    const payload = await loadStudioTemplates();
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load studio templates' });
  }
});

app.post('/api/admin/studio-templates', requireAdmin, async (req, res) => {
  const { name, dayStart, dayEnd, slotIntervalMinutes } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    typeof dayStart !== 'string' ||
    typeof dayEnd !== 'string' ||
    typeof slotIntervalMinutes !== 'number' ||
    !Number.isInteger(slotIntervalMinutes)
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }
  if (!(ALLOWED_SLOT_INTERVALS as readonly number[]).includes(slotIntervalMinutes)) {
    res.status(400).json({ error: 'slotIntervalMinutes must be 15, 30, 60, 90, or 120' });
    return;
  }
  const trimmedName = name.trim();
  if (!trimmedName) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (trimmedName.length > 80) {
    res.status(400).json({ error: 'name must be 80 characters or fewer' });
    return;
  }
  const a = parseHHMM(dayStart);
  const b = parseHHMM(dayEnd);
  if (!a.ok || !b.ok) {
    res.status(400).json({ error: 'dayStart and dayEnd must be HH:MM (24h)' });
    return;
  }
  if (b.minutes <= a.minutes) {
    res.status(400).json({ error: 'End time must be after start time' });
    return;
  }
  const slots = generateTimeSlots(
    `${String(Math.floor(a.minutes / 60)).padStart(2, '0')}:${String(a.minutes % 60).padStart(2, '0')}`,
    `${String(Math.floor(b.minutes / 60)).padStart(2, '0')}:${String(b.minutes % 60).padStart(2, '0')}`,
    slotIntervalMinutes
  );
  if (slots.length === 0) {
    res.status(400).json({ error: 'No time slots fit in the selected range' });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `INSERT INTO studio_settings (name, day_start, day_end, slot_interval_minutes)
       VALUES ($1, $2::time, $3::time, $4)
       RETURNING id`,
      [trimmedName, dayStart.trim(), dayEnd.trim(), slotIntervalMinutes]
    );
    const payload = await loadStudioTemplateById(result.rows[0].id);
    res.status(201).json(payload);
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
    if (code === '23505') {
      res.status(409).json({ error: 'A template with that name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Could not create studio template' });
  }
});

app.patch('/api/admin/studio-templates/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const { name, dayStart, dayEnd, slotIntervalMinutes } = req.body ?? {};
  if (
    typeof name !== 'string' ||
    typeof dayStart !== 'string' ||
    typeof dayEnd !== 'string' ||
    typeof slotIntervalMinutes !== 'number' ||
    !Number.isInteger(slotIntervalMinutes)
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }
  if (!(ALLOWED_SLOT_INTERVALS as readonly number[]).includes(slotIntervalMinutes)) {
    res.status(400).json({ error: 'slotIntervalMinutes must be 15, 30, 60, 90, or 120' });
    return;
  }
  const trimmedName = name.trim();
  if (!trimmedName) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  if (trimmedName.length > 80) {
    res.status(400).json({ error: 'name must be 80 characters or fewer' });
    return;
  }
  const a = parseHHMM(dayStart);
  const b = parseHHMM(dayEnd);
  if (!a.ok || !b.ok) {
    res.status(400).json({ error: 'dayStart and dayEnd must be HH:MM (24h)' });
    return;
  }
  if (b.minutes <= a.minutes) {
    res.status(400).json({ error: 'End time must be after start time' });
    return;
  }
  const slots = generateTimeSlots(
    `${String(Math.floor(a.minutes / 60)).padStart(2, '0')}:${String(a.minutes % 60).padStart(2, '0')}`,
    `${String(Math.floor(b.minutes / 60)).padStart(2, '0')}:${String(b.minutes % 60).padStart(2, '0')}`,
    slotIntervalMinutes
  );
  if (slots.length === 0) {
    res.status(400).json({ error: 'No time slots fit in the selected range' });
    return;
  }
  try {
    const result = await pool.query<{ id: number }>(
      `UPDATE studio_settings
       SET name = $1, day_start = $2::time, day_end = $3::time, slot_interval_minutes = $4
       WHERE id = $5
       RETURNING id`,
      [trimmedName, dayStart.trim(), dayEnd.trim(), slotIntervalMinutes, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const payload = await loadStudioTemplateById(id);
    res.json(payload);
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
    if (code === '23505') {
      res.status(409).json({ error: 'A template with that name already exists' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Could not update studio template' });
  }
});

app.delete('/api/admin/studio-templates/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  try {
    const count = await pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM studio_settings`);
    const total = Number(count.rows[0]?.count ?? '0');
    if (total <= 1) {
      res.status(409).json({ error: 'At least one template is required' });
      return;
    }
    const result = await pool.query(`DELETE FROM studio_settings WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not delete studio template' });
  }
});

type BookableSlotRow = { id: number; slot_date: string; slot_time: string };

app.get('/api/admin/bookable-slots', requireAdmin, async (_req, res) => {
  try {
    const result = await pool.query<BookableSlotRow>(
      `SELECT id, slot_date::text AS slot_date, to_char(slot_time, 'HH24:MI') AS slot_time
       FROM studio_bookable_slots
       ORDER BY slot_date ASC, slot_time ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load bookable slots' });
  }
});

app.post('/api/admin/bookable-slots', requireAdmin, async (req, res) => {
  const { slotDate, slotTime } = req.body ?? {};
  if (typeof slotDate !== 'string' || typeof slotTime !== 'string') {
    res.status(400).json({ error: 'slotDate and slotTime are required' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate.trim())) {
    res.status(400).json({ error: 'slotDate must be YYYY-MM-DD' });
    return;
  }
  const norm = normalizeTimeToHHMM(slotTime);
  const p = parseHHMM(norm);
  if (!p.ok) {
    res.status(400).json({ error: 'slotTime must be HH:MM' });
    return;
  }
  try {
    const result = await pool.query<BookableSlotRow>(
      `INSERT INTO studio_bookable_slots (slot_date, slot_time)
       VALUES ($1::date, $2::time)
       RETURNING id, slot_date::text AS slot_date, to_char(slot_time, 'HH24:MI') AS slot_time`,
      [slotDate.trim(), norm]
    );
    res.status(201).json(result.rows[0]);
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
    if (code === '23505') {
      res.status(409).json({ error: 'This date and time are already listed' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Could not add slot' });
  }
});

app.patch('/api/admin/bookable-slots/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  const { slotDate, slotTime } = req.body ?? {};
  if (typeof slotDate !== 'string' || typeof slotTime !== 'string') {
    res.status(400).json({ error: 'slotDate and slotTime are required' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(slotDate.trim())) {
    res.status(400).json({ error: 'slotDate must be YYYY-MM-DD' });
    return;
  }
  const norm = normalizeTimeToHHMM(slotTime);
  const p = parseHHMM(norm);
  if (!p.ok) {
    res.status(400).json({ error: 'slotTime must be HH:MM' });
    return;
  }
  try {
    const result = await pool.query<BookableSlotRow>(
      `UPDATE studio_bookable_slots
       SET slot_date = $1::date, slot_time = $2::time
       WHERE id = $3
       RETURNING id, slot_date::text AS slot_date, to_char(slot_time, 'HH24:MI') AS slot_time`,
      [slotDate.trim(), norm, id]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(result.rows[0]);
  } catch (err: unknown) {
    const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : '';
    if (code === '23505') {
      res.status(409).json({ error: 'Another slot already uses this date and time' });
      return;
    }
    console.error(err);
    res.status(500).json({ error: 'Could not update slot' });
  }
});

app.post('/api/admin/bookable-slots/fill-from-template', requireAdmin, async (req, res) => {
  const { slotDate, templateId } = req.body ?? {};
  if (typeof slotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slotDate.trim())) {
    res.status(400).json({ error: 'slotDate must be YYYY-MM-DD' });
    return;
  }
  const id = Number(templateId);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'templateId must be a valid id' });
    return;
  }
  try {
    const template = await loadStudioTemplateById(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    const generated = generateTimeSlots(template.dayStart, template.dayEnd, template.slotIntervalMinutes);
    if (generated.length === 0) {
      res.status(400).json({ error: 'Template produces no slots — widen start/end in Schedule template' });
      return;
    }
    let inserted = 0;
    for (const hm of generated) {
      const r = await pool.query(
        `INSERT INTO studio_bookable_slots (slot_date, slot_time) VALUES ($1::date, $2::time)
         ON CONFLICT (slot_date, slot_time) DO NOTHING`,
        [slotDate.trim(), hm]
      );
      inserted += r.rowCount ?? 0;
    }
    res.json({ ok: true, inserted, skipped: generated.length - inserted, totalInTemplate: generated.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not fill slots from template' });
  }
});

app.delete('/api/admin/bookable-slots/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  try {
    const result = await pool.query(`DELETE FROM studio_bookable_slots WHERE id = $1 RETURNING id`, [id]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not remove slot' });
  }
});

app.post('/api/inquiries', async (req, res) => {
  const { name, email, type, inquiry, mobile, visitDate, visitTime, bundlePreference, prcNumber } = req.body ?? {};

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof type !== 'string' ||
    typeof inquiry !== 'string' ||
    typeof visitDate !== 'string' ||
    typeof visitTime !== 'string' ||
    typeof bundlePreference !== 'string'
  ) {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  if (mobile != null && typeof mobile !== 'string') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }
  if (prcNumber != null && typeof prcNumber !== 'string') {
    res.status(400).json({ error: 'Invalid payload' });
    return;
  }

  const trimmed = {
    name: name.trim(),
    email: email.trim(),
    type: type.trim(),
    inquiry: inquiry.trim(),
    visitDate: visitDate.trim(),
    visitTime: visitTime.trim(),
    bundlePreference: bundlePreference.trim(),
    mobile:
      typeof mobile === 'string' && mobile.trim() !== ''
        ? mobile.trim().slice(0, 40)
        : null,
    prcNumber:
      typeof prcNumber === 'string' && prcNumber.trim() !== ''
        ? prcNumber.trim().slice(0, 80)
        : null,
  };

  if (!trimmed.name || !trimmed.email || !trimmed.type || !trimmed.inquiry) {
    res.status(400).json({ error: 'Name, email, project type, and inquiry are required' });
    return;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed.visitDate)) {
    res.status(400).json({ error: 'visitDate must be YYYY-MM-DD' });
    return;
  }
  const todayManila = manilaTodayYmd();
  if (trimmed.visitDate < todayManila) {
    res.status(400).json({ error: 'Visit date cannot be in the past' });
    return;
  }

  if (!isBundlePreferenceId(trimmed.bundlePreference)) {
    res.status(400).json({ error: 'Invalid bundle preference' });
    return;
  }

  const normalizedVisit = normalizeTimeToHHMM(trimmed.visitTime);
  const vt = parseHHMM(normalizedVisit);
  if (!vt.ok) {
    res.status(400).json({ error: 'visitTime must be HH:MM' });
    return;
  }

  try {
    const slots = await loadBookableSlotsForDate(trimmed.visitDate);
    if (slots.length === 0) {
      res.status(400).json({ error: 'No availability on this date' });
      return;
    }
    if (!slots.includes(normalizedVisit)) {
      res.status(400).json({ error: 'Selected time is not available for this date' });
      return;
    }

    const result = await pool.query<{
      id: number;
      name: string;
      email: string;
      mobile: string | null;
      type: string;
      inquiry: string;
      visit_date: string | null;
      visit_time: string | null;
      bundle_preference: string | null;
      prc_number: string | null;
      status: string;
      reviewed_at: string | null;
      created_at: string;
    }>(
      `INSERT INTO inquiries (name, email, mobile, type, inquiry, visit_date, visit_time, bundle_preference, prc_number)
       VALUES ($1, $2, $3, $4, $5, $6::date, $7::time, $8, $9)
       RETURNING id, name, email, mobile, type, inquiry, visit_date::text AS visit_date,
         to_char(visit_time, 'HH24:MI') AS visit_time, bundle_preference, prc_number,
         status, reviewed_at, created_at`,
      [
        trimmed.name,
        trimmed.email,
        trimmed.mobile,
        trimmed.type,
        trimmed.inquiry,
        trimmed.visitDate,
        normalizedVisit,
        trimmed.bundlePreference,
        trimmed.prcNumber,
      ]
    );
    const row = result.rows[0];
    void notifyAdminNewInquiry(row).catch((e) => console.error('[mail] notify admin new inquiry:', e));
    void notifyUserInquiryReceived(row).catch((e) => console.error('[mail] user inquiry receipt:', e));
    res.status(201).json(row);
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
      visit_date: string | null;
      visit_time: string | null;
      bundle_preference: string | null;
      prc_number: string | null;
      status: string;
      reviewed_at: Date | null;
      created_at: Date;
    }>(
      `SELECT id, name, email, mobile, type, inquiry,
              visit_date::text AS visit_date,
              to_char(visit_time, 'HH24:MI') AS visit_time,
              bundle_preference, prc_number, status, reviewed_at, created_at
       FROM inquiries
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load inquiries' });
  }
});

type InquiryRowDb = {
  id: number;
  name: string;
  email: string;
  mobile: string | null;
  type: string;
  inquiry: string;
  visit_date: string | null;
  visit_time: string | null;
  bundle_preference: string | null;
  prc_number: string | null;
  status: string;
  reviewed_at: Date | null;
  created_at: Date;
};

app.patch('/api/admin/inquiries/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};
  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }
  if (status !== 'approved' && status !== 'cancelled') {
    res.status(400).json({ error: 'status must be approved or cancelled' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<InquiryRowDb>(
      `UPDATE inquiries
       SET status = $2::text, reviewed_at = NOW()
       WHERE id = $1 AND status = 'pending'
       RETURNING id, name, email, mobile, type, inquiry,
         visit_date::text AS visit_date,
         to_char(visit_time, 'HH24:MI') AS visit_time,
         bundle_preference, prc_number, status, reviewed_at, created_at`,
      [id, status]
    );
    if (result.rowCount === 0) {
      const ex = await client.query<{ status: string }>(`SELECT status FROM inquiries WHERE id = $1`, [id]);
      await client.query('ROLLBACK');
      if (ex.rowCount === 0) {
        res.status(404).json({ error: 'Not found' });
        return;
      }
      res.status(409).json({ error: 'Inquiry is no longer pending' });
      return;
    }
    const row = result.rows[0];
    if (status === 'approved' && row.visit_date) {
      // Approved booking consumes the whole calendar date.
      await client.query(`DELETE FROM studio_bookable_slots WHERE slot_date = $1::date`, [row.visit_date]);
    }
    await client.query('COMMIT');
    if (status === 'approved') {
      void notifyUserBookingApproved(row).catch((e) => console.error('[mail] user approved:', e));
    } else {
      void notifyUserBookingCancelled(row).catch((e) => console.error('[mail] user cancelled:', e));
    }
    res.json(row);
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // no-op
    }
    console.error(err);
    res.status(500).json({ error: 'Could not update inquiry' });
  } finally {
    client.release();
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
