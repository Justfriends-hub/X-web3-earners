import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import "./db"; // ensures schema + seed run on boot

import { verifyTelegram } from "./middleware/verifyTelegram";
import { authRouter } from "./routes/auth";
import { rateRouter } from "./routes/rate";
import { tasksRouter } from "./routes/tasks";
import { monetagRouter } from "./routes/monetag";
import { withdrawalsRouter } from "./routes/withdrawals";
import { leaderboardRouter } from "./routes/leaderboard";
import { adminRouter } from "./routes/admin";

const app = express();
app.use(cors());
app.use(express.json());
// Public routes (no Telegram auth required)
app.use("/api", rateRouter);
app.use("/api", leaderboardRouter);
app.use("/api", monetagRouter);
app.use("/api", adminRouter);

// User routes — require (or dev-mode-fake) Telegram identity
app.use("/api/auth", verifyTelegram, authRouter);
app.use("/api", verifyTelegram, tasksRouter);
app.use("/api", verifyTelegram, withdrawalsRouter);

// Single-deploy mode: if the frontend has been built (frontend/dist exists),
// serve it from this same process so one URL hosts the whole app. Locally
// you can still run `npm run dev` in frontend/ separately — this is a
// no-op whenever that folder doesn't exist.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(frontendDist));

// SPA fallback: any non-API GET returns index.html instead of a 404.
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendDist, "index.html"));
  }
  next();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`X-Web3-earners backend listening on http://localhost:${PORT}`);
});
