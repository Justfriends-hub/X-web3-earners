import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// DB_PATH lets hosts like Railway point the database at a persistent volume
// (e.g. /data/data.db). Unset = local dev default next to the backend folder.
export const db = new Database(process.env.DB_PATH || path.join(__dirname, "..", "data.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id INTEGER UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT NOT NULL,
    balance_shib REAL NOT NULL DEFAULT 0,
    streak INTEGER NOT NULL DEFAULT 0,
    last_checkin_date TEXT,
    referrals INTEGER NOT NULL DEFAULT 0,
    referred_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'ad' | 'offer'
    badge TEXT,             -- 'HOT' | 'SPECIAL' | 'LIMITED' | NULL
    reward_shib REAL NOT NULL DEFAULT 0.3,
    total_slots INTEGER NOT NULL DEFAULT 1,
    completed_count INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS task_claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    reward_shib REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ad_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    task_id INTEGER,
    monetag_click_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | verified | rejected
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS withdrawals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount_shib REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected | paid
    admin_note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed tasks once, on first run.
const taskCount = db.prepare("SELECT COUNT(*) as c FROM tasks").get() as { c: number };
if (taskCount.c === 0) {
  const insert = db.prepare(`
    INSERT INTO tasks (title, category, badge, reward_shib, total_slots)
    VALUES (@title, @category, @badge, @reward_shib, @total_slots)
  `);
  const seed = db.transaction(() => {
    insert.run({ title: "Watch Ad #1", category: "ad", badge: "HOT", reward_shib: 0.3, total_slots: 20 });
    insert.run({ title: "Special Ad Task #1", category: "ad", badge: "SPECIAL", reward_shib: 0.3, total_slots: 10 });
    insert.run({ title: "Join our Discord", category: "offer", badge: null, reward_shib: 0.3, total_slots: 1 });
    insert.run({ title: "Follow on YouTube", category: "offer", badge: null, reward_shib: 0.3, total_slots: 1 });
    insert.run({ title: "Complete partner offer", category: "offer", badge: "LIMITED", reward_shib: 0.3, total_slots: 1 });
  });
  seed();
}
