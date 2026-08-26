import { Router } from "express";
import { query, queryOne, withTransaction } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const tasksRouter = Router();

const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 50, 100];

tasksRouter.get("/tasks", async (req: AuthedRequest, res) => {
  const tasks = await query<any>("SELECT * FROM tasks WHERE active = TRUE");
  const userClaims = await query<{ task_id: number }>(
    "SELECT task_id FROM task_claims WHERE user_id = $1",
    [req.userId]
  );
  const claimedTaskIds = new Set(userClaims.map((c) => c.task_id));

  const result = tasks.map((t) => {
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

  res.json(result);
});

tasksRouter.post("/tasks/:id/claim", async (req: AuthedRequest, res) => {
  const taskId = Number(req.params.id);
  const task = await queryOne<any>(
    "SELECT * FROM tasks WHERE id = $1 AND active = TRUE",
    [taskId]
  );

  if (!task) return res.status(404).json({ error: "Task not found" });
  if (task.completed_count >= task.total_slots) {
    return res.status(400).json({ error: "This task has no slots remaining" });
  }

  if (task.category === "offer") {
    const already = await queryOne(
      "SELECT id FROM task_claims WHERE user_id = $1 AND task_id = $2",
      [req.userId, taskId]
    );
    if (already) return res.status(400).json({ error: "Already completed" });
  }

  // NOTE: In production, ad-task claims should NOT be trusted directly from
  // the client like this — they should only be credited via the Monetag
  // S2S postback (see routes/monetag.ts) once ad completion is verified
  // server-to-server. This direct-claim endpoint is a placeholder so the
  // UI is testable before Monetag credentials exist.
  const updated = await withTransaction(async (tx) => {
    await tx.query(
      "INSERT INTO task_claims (user_id, task_id, reward_shib) VALUES ($1, $2, $3)",
      [req.userId, taskId, task.reward_shib]
    );
    await tx.query("UPDATE tasks SET completed_count = completed_count + 1 WHERE id = $1", [
      taskId,
    ]);
    return (await tx.queryOne<{ balance_shib: number }>(
      "UPDATE users SET balance_shib = balance_shib + $1 WHERE id = $2 RETURNING balance_shib",
      [task.reward_shib, req.userId]
    ))!;
  });

  res.json({ balance_shib: updated.balance_shib });
});

tasksRouter.post("/checkin", async (req: AuthedRequest, res) => {
  const user = await queryOne<any>("SELECT * FROM users WHERE id = $1", [req.userId]);
  const today = new Date().toISOString().slice(0, 10);

  if (user.last_checkin_date === today) {
    return res.status(400).json({ error: "Already checked in today" });
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakContinues = user.last_checkin_date === yesterday;
  const newStreak = streakContinues ? Math.min(user.streak + 1, 7) : 1;
  const reward = CHECKIN_REWARDS[newStreak - 1];

  const updated = await queryOne<{ streak: number; balance_shib: number }>(
    `UPDATE users
     SET streak = $1, last_checkin_date = $2, balance_shib = balance_shib + $3
     WHERE id = $4
     RETURNING streak, balance_shib`,
    [newStreak, today, reward, req.userId]
  );

  res.json({ streak: updated!.streak, balance_shib: updated!.balance_shib });
});
