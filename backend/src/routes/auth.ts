import { Router } from "express";
import { queryOne } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const authRouter = Router();

authRouter.post("/me", async (req: AuthedRequest, res) => {
  const user = await queryOne<any>("SELECT * FROM users WHERE id = $1", [req.userId]);

  const tasksCompleted = (await queryOne<{ c: number }>(
    "SELECT COUNT(*)::int AS c FROM task_claims WHERE user_id = $1",
    [req.userId]
  ))!;

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
