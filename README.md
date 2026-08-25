# X-Web3-earners

A Telegram Mini App "earn to click" system: users complete tasks (Monetag ad
views), get paid in SHIB (with a live USDT-equivalent display), and request
manual withdrawals through an admin panel.

This is a **local-runnable MVP scaffold** — real logic, mock/placeholder data
where a third-party account (Monetag, a live bot token) is required. Everything
is wired so swapping placeholders for real credentials is a small, contained
change, not a rewrite.

## Folder structure

```
X-Web3-earners/
├── frontend/   React + Vite Telegram Mini App (the UI you designed)
├── backend/    Express + SQLite API (users, tasks, ad postbacks, withdrawals)
├── bot/        Minimal Telegram bot that opens the Mini App
└── admin/      Static admin page for approving withdrawals
```

## Run order

Run these in **separate terminals**, in this order.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Starts on `http://localhost:4000`. Uses SQLite (`backend/data.db`, created
automatically) — no database server to install.

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Opens on `http://localhost:5173`. Works standalone in a normal browser tab
for local dev (falls back to a mock Telegram user — see `src/lib/telegram.ts`)
so you don't need Telegram running to build/test the UI.

### 3. Admin panel (optional, anytime)

Open `admin/index.html` directly in your browser, or serve it:

```bash
cd admin
npx serve .
```

Enter the admin token from `backend/.env` (`ADMIN_TOKEN`) to log in.

### 4. Telegram bot (optional — only needed to test inside real Telegram)

```bash
cd bot
npm install
cp .env.example .env   # add your BOT_TOKEN from @BotFather, and WEBAPP_URL
npm start
```

`WEBAPP_URL` must be a public HTTPS URL (Telegram won't load `localhost` —
use `ngrok http 5173` or similar for local testing inside the real app).

## What's real vs. placeholder right now

| Piece | Status |
|---|---|
| UI (all 5 screens, components, tokens) | Real, matches the design spec |
| SHIB/USDT rate | Hardcoded fallback (`0.00000445`), same seam as discussed — swap `fetchLiveShibRate()` in `backend/src/rates.ts` for a real API call later |
| Telegram `initData` verification | Real HMAC verification implemented (`backend/src/middleware/verifyTelegram.ts`) |
| Task list | Seeded mock tasks in the DB — replace with real Monetag task definitions |
| Monetag ad completion | Stub endpoint (`POST /api/monetag/postback`) — wire this to Monetag's actual S2S postback URL and signature scheme once you have Monetag credentials |
| Withdrawals | Fully functional request → pending → admin approve/reject flow, paid out manually (as you specified) |
| Bot | Minimal `/start` handler that opens the Mini App — no other bot logic yet |

## Next steps (not built yet, flagging so nothing's assumed silently)

- Real Monetag postback signature verification (currently accepts any POST — **do not deploy publicly until this is locked down**, it's the fraud-prevention seam described earlier)
- Rate limiting / per-user task cooldowns (anti-abuse layer discussed earlier)
- Real SHIB rate API integration
- Production DB (swap SQLite for Postgres when you're ready to deploy, not just run locally)
