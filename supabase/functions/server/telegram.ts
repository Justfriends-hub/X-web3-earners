/**
 * Telegram WebApp `initData` verification per Telegram's official algorithm:
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Uses Web Crypto (Deno runtime) instead of Node's crypto module. When
 * BOT_TOKEN is not configured the function runs in UNVERIFIED dev mode and
 * trusts the header at face value — never deploy without BOT_TOKEN set.
 */

import { sql } from "./db.ts";
import { HttpError } from "./http.ts";

const encoder = new TextEncoder();

interface TgUser {
  id: number;
  first_name: string;
  username?: string;
}

async function hmac(key: Uint8Array, message: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    encoder.encode(message),
  );
  return new Uint8Array(sig);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseUserUnsafe(initData: string): TgUser | null {
  try {
    const raw = new URLSearchParams(initData).get("user");
    return raw ? (JSON.parse(raw) as TgUser) : null;
  } catch {
    return null;
  }
}

async function upsertUser(user: TgUser, referralCode?: string | null): Promise<number> {
  const existing = await sql<{ id: number; referred_by: number | null }>`
    SELECT id, referred_by FROM users WHERE telegram_id = ${user.id} LIMIT 1
  `;
  if (existing.length > 0) return existing[0].id;

  // New user — check referral code (ref_<telegram_id>)
  let referredById: number | null = null;
  if (referralCode && referralCode.startsWith("ref_")) {
    const refTelegramId = Number(referralCode.slice(4));
    if (!isNaN(refTelegramId) && refTelegramId !== user.id) {
      const referrer = await sql<{ id: number }>`
        SELECT id FROM users WHERE telegram_id = ${refTelegramId} LIMIT 1
      `;
      if (referrer.length > 0) referredById = referrer[0].id;
    }
  }

  if (referredById !== null) {
    const inserted = await sql.begin(async (tx) => {
      const newUser = await tx<{ id: number }>`
        INSERT INTO users (telegram_id, first_name, username, referred_by)
        VALUES (${user.id}, ${user.first_name}, ${user.username ?? null}, ${referredById})
        RETURNING id
      `;
      await tx`
        UPDATE users SET referrals = referrals + 1, balance_shib = balance_shib + 2500
        WHERE id = ${referredById}
      `;
      return newUser[0];
    });
    return inserted.id;
  }

  const inserted = await sql<{ id: number }>`
    INSERT INTO users (telegram_id, first_name, username)
    VALUES (${user.id}, ${user.first_name}, ${user.username ?? null})
    RETURNING id
  `;
  return inserted[0].id;
}

let warnedNoToken = false;

/** Returns the internal users.id for the caller, or throws an HttpError. */
export async function getUserIdFromRequest(req: Request): Promise<number> {
  const initData = req.headers.get("x-telegram-init-data") ?? "";
  const referralCode =
    req.headers.get("x-referral-code") ??
    new URL(req.url).searchParams.get("startapp") ??
    new URL(req.url).searchParams.get("referral_code");
  const botToken = Deno.env.get("BOT_TOKEN") ?? "";

  if (!botToken) {
    if (!warnedNoToken) {
      console.warn(
        "[telegram] BOT_TOKEN not set — running in UNVERIFIED dev mode. Do not deploy like this.",
      );
      warnedNoToken = true;
    }
    const devUser = parseUserUnsafe(initData) ?? {
      id: 999999999,
      first_name: "Dev",
      username: "dev_user",
    };
    return upsertUser(devUser, referralCode);
  }

  if (!initData) throw new HttpError(401, "Missing Telegram init data");

  const params = new URLSearchParams(initData);
  const hash = params.get("hash") ?? "";
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = await hmac(encoder.encode("WebAppData"), botToken);
  const computedHash = toHex(await hmac(secretKey, dataCheckString));

  if (computedHash !== hash) {
    throw new HttpError(401, "Invalid Telegram init data");
  }

  const user = parseUserUnsafe(initData);
  if (!user) throw new HttpError(401, "No user in init data");

  return upsertUser(user, referralCode);
}
