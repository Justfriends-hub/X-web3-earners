import { Router } from "express";
import { db } from "../db";
import { AuthedRequest } from "../middleware/verifyTelegram";

export const withdrawalsRouter = Router();

withdrawalsRouter.post("/withdrawals", (req: AuthedRequest, res) => {
  const { amount_shib } = req.body as { amount_shib: number };

  if (!amount_shib || amount_shib <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.userId) as any;
  if (amount_shib > user.balance_shib) {
    return res.status(400).json({ error: "Amount exceeds balance" });
  }

  const result = db.transaction(() => {
    const w = db
      .prepare("INSERT INTO withdrawals (user_id, amount_shib) VALUES (?, ?)")
      .run(req.userId, amount_shib);
    db.prepare("UPDATE users SET balance_shib = balance_shib - ? WHERE id = ?").run(
      amount_shib,
      req.userId
    );
    return w.lastInsertRowid as number;
  })();

  res.json({ id: result, status: "pending" });
});
