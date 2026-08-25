import { Me, Task, RateInfo } from "./api";

// Used only if the backend isn't running yet, so the UI is still browsable
// standalone. Real data always wins once the backend responds.

export const mockMe: Me = {
  id: 1,
  telegram_id: 999999999,
  username: "dev_user",
  first_name: "Dev",
  balance_shib: 4.2,
  tasks_completed: 3,
  streak: 2,
  referrals: 0,
};

export const mockRate: RateInfo = {
  rate: 0.00000445,
  source: "fallback",
};

export const mockTasks: Task[] = [
  {
    id: 1,
    title: "Watch Ad #1",
    category: "ad",
    badge: "HOT",
    reward_shib: 0.3,
    completed_count: 0,
    total_slots: 20,
    status: "available",
  },
  {
    id: 2,
    title: "Special Ad Task #1",
    category: "ad",
    badge: "SPECIAL",
    reward_shib: 0.3,
    completed_count: 0,
    total_slots: 10,
    status: "available",
  },
  {
    id: 3,
    title: "Join our Discord",
    category: "offer",
    badge: null,
    reward_shib: 0.3,
    completed_count: 1,
    total_slots: 1,
    status: "completed",
  },
  {
    id: 4,
    title: "Follow on YouTube",
    category: "offer",
    badge: null,
    reward_shib: 0.3,
    completed_count: 0,
    total_slots: 1,
    status: "available",
  },
  {
    id: 5,
    title: "Complete partner offer",
    category: "offer",
    badge: "LIMITED",
    reward_shib: 0.3,
    completed_count: 1,
    total_slots: 1,
    status: "exhausted",
  },
];

export const mockLeaderboard = [
  { rank: 1, username: "shib_whale_92", value: 3800 },
  { rank: 2, username: "moonboy", value: 2500 },
  { rank: 3, username: "kaidoge", value: 2400 },
  { rank: 4, username: "sunrise_vip", value: 2400 },
  { rank: 5, username: "success_money", value: 2100 },
];
