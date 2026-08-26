import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { queryOne } from "../db";

export interface AuthedRequest extends Request {
  userId?: number;
}

const BOT_TOKEN = process.env.BOT_TOKEN || "";
let warnedNoToken = false;

/**
 * Verifies Telegram WebApp `initData` per Telegram's official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Real verification only runs when BOT_TOKEN is set. Without it (local dev,
 * before you've created a bot), requests are trusted at face value and a
 * dev user is created/reused — this NEVER runs in that mode once BOT_TOKEN
 * is set, so don't deploy without setting it.
 */
export async function verifyTelegram(req: AuthedRequest, res: Response, next: NextFunction) {
  const initData = req.header("X-Telegram-Init-Data") || "";

  if (!BOT_TOKEN) {
    if (!warnedNoToken) {
      console.warn(
        "[verifyTelegram] BOT_TOKEN not set — running in UNVERIFIED dev mode. Do not deploy like this."
      );
      warnedNoToken = true;
    }
    const devUser = parseUserUnsafe(initData) ?? {
      id: 999999999,
      first_name: "Dev",
      username: "dev_user",
    };
    req.userId = await upsertUser(devUser.id, devUser.first_name, devUser.username);
    return next();
  }

  if (!initData) {
    return res.status(401).json({ error: "Missing Telegram init data" });
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return res.status(401).json({ error: "Invalid Telegram init data" });
  }

  const user = parseUserUnsafe(initData);
  if (!user) {
    return res.status(401).json({ error: "No user in init data" });
  }

  req.userId = await upsertUser(user.id, user.first_name, user.username);
  next();
}

function parseUserUnsafe(initData: string) {
  try {
    const params = new URLSearchParams(initData);
    const raw = params.get("user");
    if (!raw) return null;
    return JSON.parse(raw) as { id: number; first_name: string; username?: string };
  } catch {
    return null;
  }
}

async function upsertUser(telegramId: number, firstName: string, username?: string): Promise<number> {
  const existing = await queryOne<{ id: number }>(
    "SELECT id FROM users WHERE telegram_id = $1",
    [telegramId]
  );
  if (existing) return existing.id;

  const inserted = await queryOne<{ id: number }>(
    "INSERT INTO users (telegram_id, first_name, username) VALUES ($1, $2, $3) RETURNING id",
    [telegramId, firstName, username ?? null]
  );

  return inserted!.id;
}
