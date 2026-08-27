/**
 * X-Web3-earners — SINGLE-FILE Edge Function (paste this ENTIRE file as
 * supabase/functions/server/index.ts in the Supabase dashboard editor).
 *
 * Deploy: Edge Functions → Create function "server" → Verify JWT OFF → paste → Deploy.
 * Then add ADMIN_TOKEN in Secrets. The function URL is https://<ref>.supabase.co/functions/v1/server
 */

import postgres from "npm:postgres";

// ---------------------------------------------------------------- http ---

class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data, X-Admin-Token",
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function empty(status = 200): Response {
  return new Response(null, { status, headers: corsHeaders });
}
function fail(status: number, message: string): Response {
  return json({ error: message }, status);
}

// ------------------------------------------------------------------ db ---

// In production Supabase injects SUPABASE_DB_URL automatically. Locally use DATABASE_URL.
const connectionString =
  Deno.env.get("SUPABASE_DB_URL") ?? Deno.env.get("DATABASE_URL");
if (!connectionString) {
  throw new Error(
    "[db] No connection string. SUPABASE_DB_URL should be auto-set in production; set DATABASE_URL locally.",
  );
}
const sql = postgres(connectionString, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
});

// ------------------------------------------------------------ telegram ---

const encoder = new TextEncoder();
interface TgUser { id: number; first_name: string; username?: string; }

async function hmac(key: Uint8Array, message: string): Promise<Uint8Array> {
  const k = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", k, encoder.encode(message));
  return new Uint8Array(sig);
}
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function parseUserUnsafe(initData: string): TgUser | null {
  try {
    const raw = new URLSearchParams(initData).get("user");
    return raw ? (JSON.parse(raw) as TgUser) : null;
  } catch { return null; }
}
async function upsertUser(user: TgUser): Promise<number> {
  const existing = await sql<{ id: number }>`SELECT id FROM users WHERE telegram_id = ${user.id} LIMIT 1`;
  if (existing.length > 0) return existing[0].id;
  const inserted = await sql<{ id: number }>`
    INSERT INTO users (telegram_id, first_name, username)
    VALUES (${user.id}, ${user.first_name}, ${user.username ?? null}) RETURNING id`;
  return inserted[0].id;
}
let warnedNoToken = false;
async function getUserIdFromRequest(req: Request): Promise<number> {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const botToken = Deno.env.get("BOT_TOKEN") ?? "";
  if (!botToken) {
    if (!warnedNoToken) { console.warn("[telegram] BOT_TOKEN not set — UNVERIFIED dev mode."); warnedNoToken = true; }
    const devUser = parseUserUnsafe(initData) ?? { id: 999999999, first_name: "Dev", username: "dev_user" };
    return upsertUser(devUser);
  }
  if (!initData) throw new HttpError(401, "Missing Telegram init data");
  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? ""; params.delete("hash");
  const dataCheckString = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secretKey = await hmac(encoder.encode("WebAppData"), botToken);
  const computedHash = toHex(await hmac(secretKey, dataCheckString));
  if (computedHash !== hash) throw new HttpError(401, "Invalid Telegram init data");
  const user = parseUserUnsafe(initData);
  if (!user) throw new HttpError(401, "No user in init data");
  return upsertUser(user);
}

// ------------------------------------------------------------ handlers ---

const SHIB_USDT_FALLBACK_RATE = 0.00000445;
async function fetchLiveShibRate(): Promise<number> { throw new Error("Live rate API not implemented yet"); }
async function getShibRate(): Promise<{ rate: number; source: "live" | "fallback" }> {
  try { const live = await fetchLiveShibRate(); if (live && live > 0) return { rate: live, source: "live" }; } catch { /* fallback */ }
  return { rate: SHIB_USDT_FALLBACK_RATE, source: "fallback" };
}
async function getRate(): Promise<Response> { return json(await getShibRate()); }

async function me(userId: number): Promise<Response> {
  const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0] as any; if (!user) throw new HttpError(404, "User not found");
  const counts = await sql<{ c: number }>`SELECT COUNT(*)::int AS c FROM task_claims WHERE user_id = ${userId}`;
  return json({ id: user.id, telegram_id: user.telegram_id, username: user.username, first_name: user.first_name, balance_shib: user.balance_shib, tasks_completed: counts[0].c, streak: user.streak, referrals: user.referrals });
}
async function listTasks(userId: number): Promise<Response> {
  const tasks = await sql`SELECT * FROM tasks WHERE active = TRUE ORDER BY id`;
  const claims = await sql<{ task_id: number }>`SELECT task_id FROM task_claims WHERE user_id = ${userId}`;
  const claimedTaskIds = new Set(claims.map((c) => c.task_id));
  const result = (tasks as any[]).map((t) => {
    const exhausted = t.completed_count >= t.total_slots;
    const claimedByUser = claimedTaskIds.has(t.id);
    let status: "available" | "completed" | "exhausted" = "available";
    if (t.category === "offer" && claimedByUser) status = "completed"; else if (exhausted) status = "exhausted";
    return { id: t.id, title: t.title, category: t.category, badge: t.badge, reward_shib: t.reward_shib, completed_count: t.completed_count, total_slots: t.total_slots, status };
  });
  return json(result);
}
async function claimTask(userId: number, taskIdParam: string): Promise<Response> {
  const taskId = Number(taskIdParam);
  const rows = await sql`SELECT * FROM tasks WHERE id = ${taskId} AND active = TRUE LIMIT 1`;
  const task = rows[0] as any; if (!task) return fail(404, "Task not found");
  if (task.completed_count >= task.total_slots) return fail(400, "This task has no slots remaining");
  if (task.category === "offer") {
    const already = await sql`SELECT id FROM task_claims WHERE user_id = ${userId} AND task_id = ${taskId} LIMIT 1`;
    if (already.length > 0) return fail(400, "Already completed");
  }
  const updated = await sql.begin(async (tx) => {
    await tx`INSERT INTO task_claims (user_id, task_id, reward_shib) VALUES (${userId}, ${taskId}, ${task.reward_shib})`;
    await tx`UPDATE tasks SET completed_count = completed_count + 1 WHERE id = ${taskId}`;
    const r = await tx<{ balance_shib: number }>`UPDATE users SET balance_shib = balance_shib + ${task.reward_shib} WHERE id = ${userId} RETURNING balance_shib`;
    return r[0];
  });
  return json({ balance_shib: updated.balance_shib });
}
const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 50, 100];
async function checkIn(userId: number): Promise<Response> {
  const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0] as any; if (!user) throw new HttpError(404, "User not found");
  const today = new Date().toISOString().slice(0, 10);
  if (user.last_checkin_date === today) return fail(400, "Already checked in today");
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakContinues = user.last_checkin_date === yesterday;
  const newStreak = streakContinues ? Math.min(user.streak + 1, 7) : 1;
  const reward = CHECKIN_REWARDS[newStreak - 1];
  const updated = await sql<{ streak: number; balance_shib: number }>`
    UPDATE users SET streak = ${newStreak}, last_checkin_date = ${today}, balance_shib = balance_shib + ${reward} WHERE id = ${userId} RETURNING streak, balance_shib`;
  return json({ streak: updated[0].streak, balance_shib: updated[0].balance_shib });
}
async function createWithdrawal(req: Request, userId: number): Promise<Response> {
  const body = await req.json().catch(() => ({} as any));
  const amountShib = Number(body.amount_shib);
  if (!amountShib || amountShib <= 0) return fail(400, "Invalid amount");
  const users = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  if (amountShib > (users[0] as any).balance_shib) return fail(400, "Amount exceeds balance");
  const inserted = await sql.begin(async (tx) => {
    const w = await tx<{ id: number }>`INSERT INTO withdrawals (user_id, amount_shib) VALUES (${userId}, ${amountShib}) RETURNING id`;
    await tx`UPDATE users SET balance_shib = balance_shib - ${amountShib} WHERE id = ${userId}`;
    return w[0];
  });
  return json({ id: inserted.id, status: "pending" });
}
async function leaderboard(req: Request): Promise<Response> {
  const type = new URL(req.url).searchParams.get("type") === "earners" ? "earners" : "referrals";
  const column = type === "earners" ? "balance_shib" : "referrals";
  const rows = await sql.unsafe(`SELECT username, first_name, ${column} AS value FROM users ORDER BY ${column} DESC LIMIT 20`);
  const result = (rows as any[]).filter((r) => r.value > 0).map((r, i) => ({ rank: i + 1, username: r.username || r.first_name, value: Math.round(r.value) }));
  return json(result);
}
async function monetagPostback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  await sql`INSERT INTO ad_events (user_id, task_id, monetag_click_id, status) VALUES (${Number(url.searchParams.get("user_id")) || null}, ${Number(url.searchParams.get("task_id")) || null}, ${url.searchParams.get("click_id") ?? ""}, 'pending')`;
  console.warn("[monetag] Postback received but NOT verified or credited.", Object.fromEntries(url.searchParams.entries()));
  return empty(200);
}
function adminToken(): string { return Deno.env.get("ADMIN_TOKEN") ?? "change-me-local-dev-only"; }
async function admin(req: Request, segs: string[]): Promise<Response> {
  if (req.headers.get("x-admin-token") !== adminToken()) return fail(401, "Invalid admin token");
  if (req.method === "GET" && segs[1] === "withdrawals" && segs.length === 2) {
    const status = new URL(req.url).searchParams.get("status") ?? "pending";
    const rows = await sql`SELECT w.id, w.amount_shib, w.status, w.created_at, u.telegram_id, u.username, u.first_name FROM withdrawals w JOIN users u ON u.id = w.user_id WHERE w.status = ${status} ORDER BY w.created_at ASC`;
    const { rate } = await getShibRate();
    return json((rows as any[]).map((r) => ({ ...r, amount_usdt: r.amount_shib * rate })));
  }
  if (req.method === "POST" && segs[1] === "withdrawals" && segs.length === 4) {
    const [, , id, action] = segs;
    if (action === "approve") { await sql`UPDATE withdrawals SET status = 'approved', updated_at = now() WHERE id = ${id}`; return empty(200); }
    if (action === "paid") { await sql`UPDATE withdrawals SET status = 'paid', updated_at = now() WHERE id = ${id}`; return empty(200); }
    if (action === "reject") {
      const body = await req.json().catch(() => ({} as any));
      const wrows = await sql`SELECT * FROM withdrawals WHERE id = ${id} LIMIT 1`;
      const w = wrows[0] as any; if (!w) throw new HttpError(404, "Withdrawal not found");
      await sql.begin(async (tx) => {
        await tx`UPDATE withdrawals SET status = 'rejected', admin_note = ${body.note ?? null}, updated_at = now() WHERE id = ${id}`;
        await tx`UPDATE users SET balance_shib = balance_shib + ${w.amount_shib} WHERE id = ${w.user_id}`;
      });
      return empty(200);
    }
  }
  return fail(404, "Not found");
}

// ---------------------------------------------------------------- router ---

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  const url = new URL(req.url);
  const marker = url.pathname.indexOf("/api/");
  if (marker === -1) return json({ error: "Not found", hint: "API routes live under /api/ — try /api/rate" }, 404);
  const route = url.pathname.slice(marker + 5).replace(/\/+$/, "");
  const segs = route.split("/").filter(Boolean);
  try {
    if (req.method === "GET" && route === "rate") return await getRate();
    if (req.method === "GET" && route === "leaderboard") return await leaderboard(req);
    if (req.method === "POST" && route === "monetag/postback") return await monetagPostback(req);
    if (segs[0] === "admin") return await admin(req, segs);
    const userId = await getUserIdFromRequest(req);
    if (req.method === "POST" && route === "auth/me") return await me(userId);
    if (req.method === "GET" && route === "tasks") return await listTasks(userId);
    if (req.method === "POST" && segs[0] === "tasks" && segs[2] === "claim") return await claimTask(userId, segs[1]);
    if (req.method === "POST" && route === "checkin") return await checkIn(userId);
    if (req.method === "POST" && route === "withdrawals") return await createWithdrawal(req, userId);
    return json({ error: "Not found" }, 404);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("[unhandled]", err);
    return json({ error: "Internal server error" }, 500);
  }
});
