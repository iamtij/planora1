-- Local + reference schema; Railway can run the same SQL once against managed Postgres.
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  type TEXT NOT NULL,
  inquiry TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries (created_at DESC);
