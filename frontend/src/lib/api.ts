import { getInitData } from "./telegram";

// Empty string = same origin (works when the backend serves this app itself,
// which is how production deploys run). For local standalone dev, frontend/.env
// sets VITE_API_URL=http://localhost:4000.
const API_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Telegram-Init-Data": getInitData(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export interface Me {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string;
  balance_shib: number;
  tasks_completed: number;
  streak: number;
  referrals: number;
}

export interface Task {
  id: number;
  title: string;
  category: string;
  badge: "HOT" | "SPECIAL" | "LIMITED" | null;
  reward_shib: number;
  completed_count: number;
  total_slots: number;
  status: "available" | "completed" | "exhausted";
  url?: string | null;
}

export interface RateInfo {
  rate: number;
  source: "live" | "fallback";
}

export const api = {
  getMe: (referralCode?: string | null) =>
    request<Me>("/api/auth/me", {
      method: "POST",
      headers: referralCode ? { "X-Referral-Code": referralCode } : {},
      body: referralCode ? JSON.stringify({ referral_code: referralCode }) : undefined,
    }),
  getRate: () => request<RateInfo>("/api/rate"),
  getTasks: () => request<Task[]>("/api/tasks"),
  claimTask: (taskId: number) =>
    request<{ balance_shib: number }>(`/api/tasks/${taskId}/claim`, {
      method: "POST",
    }),
  checkIn: () =>
    request<{ streak: number; balance_shib: number }>("/api/checkin", {
      method: "POST",
    }),
  requestWithdrawal: (amountShib: number) =>
    request<{ id: number; status: string }>("/api/withdrawals", {
      method: "POST",
      body: JSON.stringify({ amount_shib: amountShib }),
    }),
  getLeaderboard: (type: "referrals" | "earners") =>
    request<{ rank: number; username: string; value: number }[]>(
      `/api/leaderboard?type=${type}`
    ),
  getChannelStatus: () =>
    request<{ joined: boolean; claimed: boolean; channelUrl: string }>("/api/channel/status"),
  claimWelcome: () =>
    request<{ balance_shib: number; claimed: boolean }>("/api/channel/claim", { method: "POST" }),
};

export { API_URL };
