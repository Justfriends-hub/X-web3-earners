/**
 * Thin wrapper around the Telegram WebApp SDK.
 *
 * Falls back to a mock user when not running inside Telegram (i.e. a normal
 * browser tab during local dev) so you can build/test the UI without needing
 * Telegram open. The `initData` raw string is what gets sent to the backend
 * for real HMAC verification — never trust the parsed user object alone,
 * it's only used here for convenience client-side display.
 */

export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
}

const isTelegramEnv =
  typeof window !== "undefined" && !!(window as any).Telegram?.WebApp;

export function getTelegramWebApp() {
  if (isTelegramEnv) {
    return (window as any).Telegram.WebApp;
  }
  return null;
}

export function initTelegram() {
  const webApp = getTelegramWebApp();
  if (webApp) {
    webApp.ready();
    webApp.expand();
  }
}

export function getTelegramUser(): TelegramUser {
  const webApp = getTelegramWebApp();
  const user = webApp?.initDataUnsafe?.user;
  if (user) {
    return {
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      photo_url: user.photo_url,
    };
  }

  // Dev-mode fallback — only used outside real Telegram.
  return {
    id: 999999999,
    first_name: "Dev",
    username: "dev_user",
  };
}

export function getInitData(): string {
  const webApp = getTelegramWebApp();
  return webApp?.initData ?? "";
}

export function isRunningInTelegram(): boolean {
  return isTelegramEnv;
}

export function getReferralCode(): string | null {
  const webApp = getTelegramWebApp();
  const startParam = (webApp as any)?.initDataUnsafe?.start_param as string | undefined;
  if (startParam && startParam.startsWith("ref_")) return startParam;

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const param =
      params.get("startapp") ??
      params.get("tgWebAppStartParam") ??
      params.get("start_param");
    if (param && param.startsWith("ref_")) return param;
  }
  return null;
}
