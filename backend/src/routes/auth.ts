import { Router } from "express";
import { db } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const authRouter = Router();

authRouter.post("/me", (req: AuthedRequest, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;

  const tasksCompleted = db
    .prepare("SELECT COUNT(*) as c FROM task_claims WHERE user_id = ?")
    .get(req.userId) as { c: number };

  res.json({
    id: user.id,
    telegram_id: user.telegram_id,
    username: user.username,
    first_name: user.first_name,
    balance_shib: user.balance_shib,
    tasks_completed: tasksCompleted.c,
    streak: user.streak,
    referrals: user.referrals,
  });
});
