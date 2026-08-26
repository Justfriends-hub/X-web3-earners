-- X-Web3-earners — Supabase schema + seed
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run
-- Safe to run more than once (CREATE TABLE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT NOT NULL,
  balance_shib DOUBLE PRECISION NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  last_checkin_date TEXT,
  referrals INTEGER NOT NULL DEFAULT 0,
  referred_by BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,      -- 'ad' | 'offer'
  badge TEXT,                  -- 'HOT' | 'SPECIAL' | 'LIMITED' | NULL
  reward_shib DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  total_slots INTEGER NOT NULL DEFAULT 1,
  completed_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS task_claims (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  task_id BIGINT NOT NULL REFERENCES tasks(id),
  reward_shib DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  task_id BIGINT,
  monetag_click_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | verified | rejected
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS withdrawals (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount_shib DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',   -- pending | approved | rejected | paid
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the starter tasks once.
INSERT INTO tasks (title, category, badge, reward_shib, total_slots)
SELECT * FROM (VALUES
  ('Watch Ad #1',        'ad',    'HOT',     0.3, 20),
  ('Special Ad Task #1', 'ad',    'SPECIAL', 0.3, 10),
  ('Join our Discord',   'offer', NULL,      0.3, 1),
  ('Follow on YouTube',  'offer', NULL,      0.3, 1),
  ('Complete partner offer', 'offer', 'LIMITED', 0.3, 1)
) AS seed(title, category, badge, reward_shib, total_slots)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
