/**
 * X-Web3-earners API — single Supabase Edge Function.
 *
 * Deployed name: "server". Invoked at:
 *   https://<project-ref>.supabase.co/functions/v1/server/api/...
 *
 * Routing: Supabase forwards everything after /functions/v1/server to this
 * function, so we find the "/api/" segment inside the pathname and dispatch
 * on what follows it. Same routes as the old Express backend:
 *
 *   Public:   GET  api/rate            GET  api/leaderboard?type=
 *             POST api/monetag/postback
 *   Admin:    GET  api/admin/withdrawals?status=
 *             POST api/admin/withdrawals/:id/approve|paid|reject
 *   Telegram: POST api/auth/me         GET  api/tasks
 *             POST api/tasks/:id/claim POST  api/checkin
 *             POST api/withdrawals
 */

import { getUserIdFromRequest } from "./telegram.ts";
import { HttpError, corsHeaders, json } from "./http.ts";
import * as h from "./handlers.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const marker = url.pathname.indexOf("/api/");
  if (marker === -1) {
    return json(
      { error: "Not found", hint: "API routes live under /api/ — try /api/rate" },
      404,
    );
  }
  const route = url.pathname.slice(marker + 5).replace(/\/+$/, "");
  const segs = route.split("/").filter(Boolean);

  try {
    // ---- public --------------------------------------------------------
    if (req.method === "GET" && route === "rate") return await h.getRate();
    if (req.method === "GET" && route === "leaderboard") {
      return await h.leaderboard(req);
    }
    if (req.method === "POST" && route === "monetag/postback") {
      return await h.monetagPostback(req);
    }

    // ---- admin (token-authenticated) -----------------------------------
    if (segs[0] === "admin") return await h.admin(req, segs);

    // ---- telegram-authenticated -----------------------------------------
    const userId = await getUserIdFromRequest(req);

    if (req.method === "POST" && route === "auth/me") return await h.me(userId);
    if (req.method === "GET" && route === "channel/status") return await h.channelStatus(userId);
    if (req.method === "POST" && route === "channel/claim") return await h.claimWelcome(userId);
    if (req.method === "GET" && route === "tasks") return await h.listTasks(userId);
    if (req.method === "POST" && segs[0] === "tasks" && segs[2] === "claim") {
      return await h.claimTask(userId, segs[1]);
    }
    if (req.method === "POST" && route === "checkin") return await h.checkIn(userId);
    if (req.method === "POST" && route === "withdrawals") {
      return await h.createWithdrawal(req, userId);
    }

    return json({ error: "Not found" }, 404);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    console.error("[unhandled]", err);
    return json({ error: "Internal server error" }, 500);
  }
});
