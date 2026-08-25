import "dotenv/config";
import express from "express";
import cors from "cors";
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

app.get("/", (_req, res) => {
  res.send("X-Web3-earners API is running.");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`X-Web3-earners backend listening on http://localhost:${PORT}`);
});
