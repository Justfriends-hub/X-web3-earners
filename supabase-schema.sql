-- ============================================================
-- X-Web3-earners — complete database setup for Supabase
-- ============================================================
-- HOW TO RUN:
--   1. Open your project at supabase.com
--   2. Left sidebar → SQL Editor → "New query"
--   3. Paste this ENTIRE file into the editor
--   4. Click Run  → you should see "Success. No rows returned"
--
-- Safe to run more than once: tables are only created if missing,
-- and the 5 starter tasks are only inserted when tasks is empty.
-- ============================================================

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
  welcome_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- For existing deployments (run before this file was created):
ALTER TABLE users ADD COLUMN IF NOT EXISTS welcome_claimed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,      -- 'ad' | 'offer'
  badge TEXT,                  -- 'HOT' | 'SPECIAL' | 'LIMITED' | NULL
  reward_shib DOUBLE PRECISION NOT NULL DEFAULT 0.3,
  total_slots INTEGER NOT NULL DEFAULT 1,
  completed_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  url TEXT
);

-- For existing deployments (add url column for monetag/omg links):
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS url TEXT;
UPDATE tasks SET url = 'https://omg10.com/4/11018116' WHERE url IS NULL;

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
INSERT INTO tasks (title, category, badge, reward_shib, total_slots, url)
SELECT * FROM (VALUES
  ('Watch Ad #1',        'ad',    'HOT',     0.3, 20, 'https://omg10.com/4/11018116'),
  ('Special Ad Task #1', 'ad',    'SPECIAL', 0.3, 10, 'https://omg10.com/4/11018116'),
  ('Join our Discord',   'offer', NULL,      0.3, 1,  'https://omg10.com/4/11018116'),
  ('Follow on YouTube',  'offer', NULL,      0.3, 1,  'https://omg10.com/4/11018116'),
  ('Complete partner offer', 'offer', 'LIMITED', 0.3, 1,  'https://omg10.com/4/11018116')
) AS seed(title, category, badge, reward_shib, total_slots, url)
WHERE NOT EXISTS (SELECT 1 FROM tasks);
