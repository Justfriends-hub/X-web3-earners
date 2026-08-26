import { Router } from "express";
import { queryOne, withTransaction } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const withdrawalsRouter = Router();

withdrawalsRouter.post("/withdrawals", async (req: AuthedRequest, res) => {
  const { amount_shib } = req.body as { amount_shib: number };

  if (!amount_shib || amount_shib <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const user = await queryOne<any>("SELECT * FROM users WHERE id = $1", [req.userId]);
  if (amount_shib > user.balance_shib) {
    return res.status(400).json({ error: "Amount exceeds balance" });
  }

  const w = await withTransaction(async (tx) => {
    const inserted = (await tx.queryOne<{ id: number }>(
      "INSERT INTO withdrawals (user_id, amount_shib) VALUES ($1, $2) RETURNING id",
      [req.userId, amount_shib]
    ))!;
    await tx.query("UPDATE users SET balance_shib = balance_shib - $1 WHERE id = $2", [
      amount_shib,
      req.userId,
    ]);
    return inserted;
  });

  res.json({ id: w.id, status: "pending" });
});
