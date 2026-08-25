import { Router } from "express";
import { db } from "../db";
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
  const rows = db
    .prepare(
      `SELECT w.id, w.amount_shib, w.status, w.created_at, u.telegram_id, u.username, u.first_name
       FROM withdrawals w JOIN users u ON u.id = w.user_id
       WHERE w.status = ?
       ORDER BY w.created_at ASC`
    )
    .all(status) as any[];

  const { rate } = await getShibRate();

  res.json(rows.map((r) => ({ ...r, amount_usdt: r.amount_shib * rate })));
});

adminRouter.post("/admin/withdrawals/:id/approve", (req, res) => {
  db.prepare(
    "UPDATE withdrawals SET status = 'approved', updated_at = datetime('now') WHERE id = ?"
  ).run(req.params.id);
  res.sendStatus(200);
});

adminRouter.post("/admin/withdrawals/:id/paid", (req, res) => {
  db.prepare(
    "UPDATE withdrawals SET status = 'paid', updated_at = datetime('now') WHERE id = ?"
  ).run(req.params.id);
  res.sendStatus(200);
});

adminRouter.post("/admin/withdrawals/:id/reject", (req, res) => {
  const { note } = req.body as { note?: string };
  const withdrawal = db.prepare("SELECT * FROM withdrawals WHERE id = ?").get(req.params.id) as any;

  db.transaction(() => {
    db.prepare(
      "UPDATE withdrawals SET status = 'rejected', admin_note = ?, updated_at = datetime('now') WHERE id = ?"
    ).run(note ?? null, req.params.id);
    // Refund the balance since it was deducted at request time.
    db.prepare("UPDATE users SET balance_shib = balance_shib + ? WHERE id = ?").run(
      withdrawal.amount_shib,
      withdrawal.user_id
    );
  })();

  res.sendStatus(200);
});
