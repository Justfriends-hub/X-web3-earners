/**
 * Every API route handler. Mirrors the old Express backend 1:1 — same paths,
 * same request/response shapes — just ported to Deno + postgres.js.
 */

import { sql } from "./db.ts";
import { HttpError, corsHeaders, fail, json, empty } from "./http.ts";

// ---------------------------------------------------------------- rate ---

export const SHIB_USDT_FALLBACK_RATE = 0.00000445; // manually set 2026-08-25

/**
 * Same seam as the old backend/src/rates.ts: when you add a real price feed,
 * implement fetchLiveShibRate() and the fallback handles the rest.
 */
async function fetchLiveShibRate(): Promise<number> {
  throw new Error("Live rate API not implemented yet");
}

async function getShibRate(): Promise<{ rate: number; source: "live" | "fallback" }> {
  try {
    const live = await fetchLiveShibRate();
    if (live && live > 0) return { rate: live, source: "live" };
  } catch {
    // fall through to fallback
  }
  return { rate: SHIB_USDT_FALLBACK_RATE, source: "fallback" };
}

export async function getRate(): Promise<Response> {
  return json(await getShibRate());
}

// ----------------------------------------------------------------- me ---

export async function me(userId: number): Promise<Response> {
  const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0];
  if (!user) throw new HttpError(404, "User not found");

  const counts = await sql<{ c: number }>`
    SELECT COUNT(*)::int AS c FROM task_claims WHERE user_id = ${userId}
  `;

  return json({
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    balance_shib: user.balance_shib,
    tasks_completed: counts[0].c,
    streak: user.streak,
    referrals: user.referrals,
  });
}

// -------------------------------------------------------------- tasks ---

export async function listTasks(userId: number): Promise<Response> {
  const tasks = await sql`SELECT * FROM tasks WHERE active = TRUE ORDER BY id`;
  const claims = await sql<{ task_id: number }>`
    SELECT task_id FROM task_claims WHERE user_id = ${userId}
  `;
  const claimedTaskIds = new Set(claims.map((c) => c.task_id));

  const result = (tasks as any[]).map((t) => {
    const exhausted = t.completed_count >= t.total_slots;
    const claimedByUser = claimedTaskIds.has(t.id);

    let status: "available" | "completed" | "exhausted" = "available";
    if (t.category === "offer" && claimedByUser) status = "completed";
    else if (exhausted) status = "exhausted";

    return {
      id: t.id,
      title: t.title,
      category: t.category,
      badge: t.badge,
      reward_shib: t.reward_shib,
      completed_count: t.completed_count,
      total_slots: t.total_slots,
      status,
    };
  });

  return json(result);
}

export async function claimTask(userId: number, taskIdParam: string): Promise<Response> {
  const taskId = Number(taskIdParam);
  const rows = await sql`
    SELECT * FROM tasks WHERE id = ${taskId} AND active = TRUE LIMIT 1
  `;
  const task = rows[0] as any;

  if (!task) return fail(404, "Task not found");
  if (task.completed_count >= task.total_slots) {
    return fail(400, "This task has no slots remaining");
  }

  if (task.category === "offer") {
    const already = await sql`
      SELECT id FROM task_claims
      WHERE user_id = ${userId} AND task_id = ${taskId} LIMIT 1
    `;
    if (already.length > 0) return fail(400, "Already completed");
  }

  // NOTE: In production, ad-task claims should NOT be trusted directly from
  // the client like this — they should only be credited via a verified
  // Monetag S2S postback. This direct claim endpoint is a placeholder.
  const updated = await sql.begin(async (tx) => {
    await tx`
      INSERT INTO task_claims (user_id, task_id, reward_shib)
      VALUES (${userId}, ${taskId}, ${task.reward_shib})
    `;
    await tx`UPDATE tasks SET completed_count = completed_count + 1 WHERE id = ${taskId}`;
    const rows = await tx<{ balance_shib: number }>`
      UPDATE users SET balance_shib = balance_shib + ${task.reward_shib}
      WHERE id = ${userId}
      RETURNING balance_shib
    `;
    return rows[0];
  });

  return json({ balance_shib: updated.balance_shib });
}

// ------------------------------------------------------------ checkin ---

const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 50, 100];

export async function checkIn(userId: number): Promise<Response> {
  const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  const user = rows[0];
  if (!user) throw new HttpError(404, "User not found");

  const today = new Date().toISOString().slice(0, 10);
  if (user.last_checkin_date === today) {
    return fail(400, "Already checked in today");
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakContinues = user.last_checkin_date === yesterday;
  const newStreak = streakContinues ? Math.min(user.streak + 1, 7) : 1;
  const reward = CHECKIN_REWARDS[newStreak - 1];

  const updated = await sql<{ streak: number; balance_shib: number }>`
    UPDATE users
    SET streak = ${newStreak}, last_checkin_date = ${today},
        balance_shib = balance_shib + ${reward}
    WHERE id = ${userId}
    RETURNING streak, balance_shib
  `;

  return json({ streak: updated[0].streak, balance_shib: updated[0].balance_shib });
}

// -------------------------------------------------------- withdrawals ---

export async function createWithdrawal(req: Request, userId: number): Promise<Response> {
  const body = await req.json().catch(() => ({}) as any);
  const amountShib = Number(body.amount_shib);

  if (!amountShib || amountShib <= 0) return fail(400, "Invalid amount");

  const users = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
  if (amountShib > (users[0] as any).balance_shib) {
    return fail(400, "Amount exceeds balance");
  }

  const inserted = await sql.begin(async (tx) => {
    const w = await tx<{ id: number }>`
      INSERT INTO withdrawals (user_id, amount_shib)
      VALUES (${userId}, ${amountShib})
      RETURNING id
    `;
    await tx`
      UPDATE users SET balance_shib = balance_shib - ${amountShib}
      WHERE id = ${userId}
    `;
    return w[0];
  });

  return json({ id: inserted.id, status: "pending" });
}

// --------------------------------------------------------- leaderboard ---

export async function leaderboard(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const type = url.searchParams.get("type") === "earners" ? "earners" : "referrals";

  // Whitelisted column names only — never interpolate raw input into SQL.
  const column = type === "earners" ? "balance_shib" : "referrals";
  const rows = await sql.unsafe(
    `SELECT username, first_name, ${column} AS value FROM users ORDER BY ${column} DESC LIMIT 20`,
  );

  const result = (rows as any[])
    .filter((r) => r.value > 0)
    .map((r, i) => ({
      rank: i + 1,
      username: r.username || r.first_name,
      value: Math.round(r.value),
    }));

  return json(result);
}

// ------------------------------------------------------------ monetag ---

export async function monetagPostback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const clickId = url.searchParams.get("click_id");
  const userId = url.searchParams.get("user_id");
  const taskId = url.searchParams.get("task_id");

  await sql`
    INSERT INTO ad_events (user_id, task_id, monetag_click_id, status)
    VALUES (${Number(userId) || null}, ${Number(taskId) || null}, ${clickId ?? ""}, 'pending')
  `;

  console.warn(
    "[monetag] Postback received but NOT verified or credited — implement signature check first.",
    Object.fromEntries(url.searchParams.entries()),
  );

  return empty(200);
}

// --------------------------------------------------------------- admin ---

function adminToken(): string {
  return Deno.env.get("ADMIN_TOKEN") ?? "change-me-local-dev-only";
}

export async function admin(req: Request, segs: string[]): Promise<Response> {
  const token = req.headers.get("x-admin-token");
  if (token !== adminToken()) return fail(401, "Invalid admin token");

  // /api/admin/withdrawals            GET    (list by ?status=)
  // /api/admin/withdrawals/:id/approve|paid|reject POST
  if (req.method === "GET" && segs[1] === "withdrawals" && segs.length === 2) {
    return listWithdrawalsForAdmin(req);
  }
  if (req.method === "POST" && segs[1] === "withdrawals" && segs.length === 4) {
    const [, , id, action] = segs;
    if (action === "approve") {
      await sql`UPDATE withdrawals SET status = 'approved', updated_at = now() WHERE id = ${id}`;
      return empty(200);
    }
    if (action === "paid") {
      await sql`UPDATE withdrawals SET status = 'paid', updated_at = now() WHERE id = ${id}`;
      return empty(200);
    }
    if (action === "reject") return rejectWithdrawal(req, id);
  }

  return fail(404, "Not found");
}

async function listWithdrawalsForAdmin(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? "pending";

  const rows = await sql`
    SELECT w.id, w.amount_shib, w.status, w.created_at,
           u.telegram_id, u.username, u.first_name
    FROM withdrawals w JOIN users u ON u.id = w.user_id
    WHERE w.status = ${status}
    ORDER BY w.created_at ASC
  `;

  const { rate } = await getShibRate();

  return json((rows as any[]).map((r) => ({ ...r, amount_usdt: r.amount_shib * rate })));
}

async function rejectWithdrawal(req: Request, id: string): Promise<Response> {
  const body = await req.json().catch(() => ({}) as any);

  const rows = await sql`SELECT * FROM withdrawals WHERE id = ${id} LIMIT 1`;
  const withdrawal = rows[0] as any;
  if (!withdrawal) throw new HttpError(404, "Withdrawal not found");

  await sql.begin(async (tx) => {
    await tx`
      UPDATE withdrawals
      SET status = 'rejected', admin_note = ${body.note ?? null}, updated_at = now()
      WHERE id = ${id}
    `;
    // Refund the balance since it was deducted at request time.
    await tx`
      UPDATE users SET balance_shib = balance_shib + ${withdrawal.amount_shib}
      WHERE id = ${withdrawal.user_id}
    `;
  });

  return empty(200);
}
