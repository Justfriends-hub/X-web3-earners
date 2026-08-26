import { Router } from "express";
import { query } from "../db";

export const monetagRouter = Router();

/**
 * Placeholder for Monetag's server-to-server (S2S) postback.
 *
 * This is the fraud-prevention seam described in the architecture plan:
 * once you have Monetag credentials, this endpoint is what THEY call
 * directly when an ad genuinely finishes — not the client. You'll need to:
 *
 *   1. Add Monetag's actual query params (they vary by ad format — check
 *      your Monetag dashboard for the exact postback URL template).
 *   2. Verify the request is really from Monetag — typically a shared
 *      secret in the URL or a signature header. Compare against
 *      process.env.MONETAG_POSTBACK_SECRET.
 *   3. Look up which internal user/task this click_id maps to (you'll pass
 *      your own user_id and task_id as a custom param when launching the ad).
 *   4. Credit the reward exactly once per click_id (idempotency — Monetag
 *      may retry the postback).
 *
 * Right now this endpoint logs the event and does NOT credit any balance —
 * intentionally, so nothing pays out until real verification is wired in.
 */
monetagRouter.post("/monetag/postback", async (req, res) => {
  const { click_id, user_id, task_id } = req.query;

  await query(
    "INSERT INTO ad_events (user_id, task_id, monetag_click_id, status) VALUES ($1, $2, $3, 'pending')",
    [Number(user_id) || null, Number(task_id) || null, String(click_id ?? "")]
  );

  console.warn(
    "[monetag] Postback received but NOT verified or credited — implement signature check first.",
    req.query
  );

  res.sendStatus(200);
});
