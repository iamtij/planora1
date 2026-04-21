-- Local + reference schema; Railway can run the same SQL once against managed Postgres.
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  type TEXT NOT NULL,
  inquiry TEXT NOT NULL,
  visit_date DATE,
  visit_time TIME,
  bundle_preference TEXT,
  prc_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS studio_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  day_start TIME NOT NULL DEFAULT '09:00',
  day_end TIME NOT NULL DEFAULT '18:00',
  slot_interval_minutes INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS studio_bookable_slots (
  id SERIAL PRIMARY KEY,
  slot_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  UNIQUE (slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_studio_bookable_slots_date ON studio_bookable_slots (slot_date);
