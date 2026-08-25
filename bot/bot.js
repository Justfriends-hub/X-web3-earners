require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN in bot/.env — get one from @BotFather.");
  process.exit(1);
}
if (!WEBAPP_URL || WEBAPP_URL.includes("your-app-url.example.com")) {
  console.error(
    "Missing/placeholder WEBAPP_URL in bot/.env — Telegram needs a public HTTPS URL " +
      "(use `ngrok http 5173` for local testing and paste the https URL here)."
  );
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

bot.onText(/\/start(.*)/, (msg, match) => {
  const chatId = msg.chat.id;
  const payload = (match && match[1] || "").trim(); // e.g. "ref_123456" from a referral link

  const startParam = payload ? `?startapp=${encodeURIComponent(payload)}` : "";

  bot.sendMessage(
    chatId,
    "Welcome to X-Web3-earners! Complete simple tasks, earn SHIB, and cash out once you " +
      "hit the minimum withdrawal.",
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Open App",
              web_app: { url: `${WEBAPP_URL}${startParam}` },
            },
          ],
        ],
      },
    }
  );
});

bot.on("polling_error", (err) => {
  console.error("[bot] polling error:", err.message);
});

console.log("X-Web3-earners bot is running (polling mode).");
