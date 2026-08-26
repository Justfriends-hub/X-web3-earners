import { Router } from "express";
import { query, queryOne, withTransaction } from "../db";
import { getShibRate } from "../rates";

export const adminRouter = Router();

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me-local-dev-only";

// Scoped to "/admin" specifically — without this path prefix, this
// middleware would intercept every request mounted under /api, including
// unrelated routes like /api/rate or /api/tasks, since Express routers run
// path-less .use() middleware for anything passing through them.
adminRouter.use("/admin", (req, res, next) => {
  const token = req.header("X-Admin-Token");
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Invalid admin token" });
  }
  next();
});

adminRouter.get("/admin/withdrawals", async (req, res) => {
  const status = (req.query.status as string) || "pending";
  const rows = await query<any>(
    `SELECT w.id, w.amount_shib, w.status, w.created_at, u.telegram_id, u.username, u.first_name
     FROM withdrawals w JOIN users u ON u.id = w.user_id
     WHERE w.status = $1
     ORDER BY w.created_at ASC`,
    [status]
  );

  const { rate } = await getShibRate();

  res.json(rows.map((r) => ({ ...r, amount_usdt: r.amount_shib * rate })));
});

adminRouter.post("/admin/withdrawals/:id/approve", async (req, res) => {
  await query("UPDATE withdrawals SET status = 'approved', updated_at = now() WHERE id = $1", [
    req.params.id,
  ]);
  res.sendStatus(200);
});

adminRouter.post("/admin/withdrawals/:id/paid", async (req, res) => {
  await query("UPDATE withdrawals SET status = 'paid', updated_at = now() WHERE id = $1", [
    req.params.id,
  ]);
  res.sendStatus(200);
});

adminRouter.post("/admin/withdrawals/:id/reject", async (req, res) => {
  const { note } = req.body as { note?: string };
  const withdrawal = await queryOne<any>("SELECT * FROM withdrawals WHERE id = $1", [
    req.params.id,
  ]);

  await withTransaction(async (tx) => {
    await tx.query(
      "UPDATE withdrawals SET status = 'rejected', admin_note = $1, updated_at = now() WHERE id = $2",
      [note ?? null, req.params.id]
    );
    // Refund the balance since it was deducted at request time.
    await tx.query("UPDATE users SET balance_shib = balance_shib + $1 WHERE id = $2", [
      withdrawal.amount_shib,
      withdrawal.user_id,
    ]);
  });

  res.sendStatus(200);
});
