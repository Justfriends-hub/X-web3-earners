import { Router } from "express";
import { query } from "../db";

export const leaderboardRouter = Router();

leaderboardRouter.get("/leaderboard", async (req, res) => {
  const type = req.query.type === "earners" ? "earners" : "referrals";

  // Whitelisted column names only — never interpolate raw user input into SQL.
  const column = type === "earners" ? "balance_shib" : "referrals";
  const rows = await query<{ username: string | null; first_name: string; value: number }>(
    `SELECT username, first_name, ${column} AS value FROM users ORDER BY ${column} DESC LIMIT 20`
  );

  const result = rows
    .filter((r) => r.value > 0)
    .map((r, i) => ({
      rank: i + 1,
      username: r.username || r.first_name,
      value: Math.round(r.value),
    }));

  res.json(result);
});
