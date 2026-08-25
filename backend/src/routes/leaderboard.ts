import { Router } from "express";
import { db } from "../db";

export const leaderboardRouter = Router();

leaderboardRouter.get("/leaderboard", (req, res) => {
  const type = req.query.type === "earners" ? "earners" : "referrals";

  const column = type === "earners" ? "balance_shib" : "referrals";
  const rows = db
    .prepare(
      `SELECT username, first_name, ${column} as value FROM users ORDER BY ${column} DESC LIMIT 20`
    )
    .all() as { username: string | null; first_name: string; value: number }[];

  const result = rows
    .filter((r) => r.value > 0)
    .map((r, i) => ({
      rank: i + 1,
      username: r.username || r.first_name,
      value: Math.round(r.value),
    }));

  res.json(result);
});
