import { Router } from "express";
import { db } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const tasksRouter = Router();

const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 50, 100];

tasksRouter.get("/tasks", (req: AuthedRequest, res) => {
  const tasks = db.prepare("SELECT * FROM tasks WHERE active = 1").all() as any[];
  const userClaims = db
    .prepare("SELECT task_id FROM task_claims WHERE user_id = ?")
    .all(req.userId) as { task_id: number }[];
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

tasksRouter.post("/tasks/:id/claim", (req: AuthedRequest, res) => {
  const taskId = Number(req.params.id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND active = 1").get(taskId) as any;

  if (!task) return res.status(404).json({ error: "Task not found" });
  if (task.completed_count >= task.total_slots) {
    return res.status(400).json({ error: "This task has no slots remaining" });
  }

  if (task.category === "offer") {
    const already = db
      .prepare("SELECT id FROM task_claims WHERE user_id = ? AND task_id = ?")
      .get(req.userId, taskId);
    if (already) return res.status(400).json({ error: "Already completed" });
  }

  // NOTE: In production, ad-task claims should NOT be trusted directly from
  // the client like this — they should only be credited via the Monetag
  // S2S postback (see routes/monetag.ts) once ad completion is verified
  // server-to-server. This direct-claim endpoint is a placeholder so the
  // UI is testable before Monetag credentials exist.
  const claim = db.transaction(() => {
    db.prepare(
      "INSERT INTO task_claims (user_id, task_id, reward_shib) VALUES (?, ?, ?)"
    ).run(req.userId, taskId, task.reward_shib);
    db.prepare("UPDATE tasks SET completed_count = completed_count + 1 WHERE id = ?").run(taskId);
    db.prepare("UPDATE users SET balance_shib = balance_shib + ? WHERE id = ?").run(
      task.reward_shib,
      req.userId
    );
    return db.prepare("SELECT balance_shib FROM users WHERE id = ?").get(req.userId) as {
      balance_shib: number;
    };
  });

  const updated = claim();
  res.json({ balance_shib: updated.balance_shib });
});

tasksRouter.post("/checkin", (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  const today = new Date().toISOString().slice(0, 10);

  if (user.last_checkin_date === today) {
    return res.status(400).json({ error: "Already checked in today" });
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const streakContinues = user.last_checkin_date === yesterday;
  const newStreak = streakContinues ? Math.min(user.streak + 1, 7) : 1;
  const reward = CHECKIN_REWARDS[newStreak - 1];

  db.prepare(
    "UPDATE users SET streak = ?, last_checkin_date = ?, balance_shib = balance_shib + ? WHERE id = ?"
  ).run(newStreak, today, reward, req.userId);

  const updated = db.prepare("SELECT balance_shib FROM users WHERE id = ?").get(req.userId) as {
    balance_shib: number;
  };

  res.json({ streak: newStreak, balance_shib: updated.balance_shib });
});
