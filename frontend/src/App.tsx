import { useEffect, useState } from "react";
import BottomNav, { Tab } from "./components/BottomNav";
import WithdrawModal from "./components/WithdrawModal";
import Home from "./screens/Home";
import Earn from "./screens/Earn";
import Play from "./screens/Play";
import Refer from "./screens/Refer";
import Account from "./screens/Account";
import { api, Me, RateInfo, Task } from "./lib/api";
import { initTelegram, getTelegramUser, getReferralCode } from "./lib/telegram";
import { mockMe, mockRate, mockTasks, mockLeaderboard } from "./lib/mockData";

const MIN_WITHDRAW_SHIB = 5000; // placeholder threshold — tune once real economics are set

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [me, setMe] = useState<Me | null>(null);
  const [rate, setRate] = useState<RateInfo | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ rank: number; username: string; value: number }[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    initTelegram();
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const referralCode = getReferralCode();
      if (referralCode) {
        try { localStorage.setItem("xwe_ref", referralCode); } catch {}
      }
      const storedRef = referralCode || (() => { try { return localStorage.getItem("xwe_ref"); } catch { return null; } })();

      const [meData, rateData, taskData, leaderboardData] = await Promise.all([
        api.getMe(storedRef),
        api.getRate(),
        api.getTasks(),
        api.getLeaderboard("referrals").catch(() => [] as { rank: number; username: string; value: number }[]),
      ]);
      setMe(meData);
      setRate(rateData);
      setTasks(taskData);
      setLeaderboard(leaderboardData);
      setUsingMock(false);
    } catch {
      // Backend not running — fall back to mock data so the UI is still
      // browsable during local frontend-only development.
      const user = getTelegramUser();
      setMe({ ...mockMe, first_name: user.first_name, telegram_id: user.id, username: user.username ?? null });
      setRate(mockRate);
      setTasks(mockTasks);
      setLeaderboard(mockLeaderboard);
      setUsingMock(true);
    }
  }

  async function handleClaimTask(taskId: number) {
    if (usingMock) {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "completed", completed_count: t.completed_count + 1 }
            : t
        )
      );
      setMe((prev) => (prev ? { ...prev, balance_shib: prev.balance_shib + 0.3 } : prev));
      return;
    }
    const result = await api.claimTask(taskId);
    setMe((prev) => (prev ? { ...prev, balance_shib: result.balance_shib } : prev));
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: "completed", completed_count: t.completed_count + 1 }
          : t
      )
    );
  }

  async function handleCheckIn() {
    if (usingMock) {
      setMe((prev) => (prev ? { ...prev, streak: prev.streak + 1 } : prev));
      return;
    }
    const result = await api.checkIn();
    setMe((prev) => (prev ? { ...prev, streak: result.streak, balance_shib: result.balance_shib } : prev));
  }

  async function handleWithdraw(amountShib: number) {
    if (usingMock) {
      setMe((prev) => (prev ? { ...prev, balance_shib: prev.balance_shib - amountShib } : prev));
      return;
    }
    await api.requestWithdrawal(amountShib);
    setMe((prev) => (prev ? { ...prev, balance_shib: prev.balance_shib - amountShib } : prev));
  }

  if (!me || !rate) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <div className="text-text-muted text-sm">Loading…</div>
      </div>
    );
  }

  // Set VITE_BOT_USERNAME in frontend/.env to your actual bot's username
  // (without @) once the bot exists — otherwise this default is used.
  const botUsername = import.meta.env.VITE_BOT_USERNAME || "XWeb3EarnersBot";
  const referralLink = `https://t.me/${botUsername}/app?startapp=ref_${me.telegram_id}`;

  return (
    <div className="min-h-[100dvh] bg-background">
      {usingMock && (
        <div className="bg-gold/20 text-gold text-xs text-center py-1.5 safe-top">
          Backend not connected — showing mock data
        </div>
      )}

      {tab === "home" && (
        <Home
          me={me}
          rate={rate}
          tasks={tasks}
          onClaimTask={handleClaimTask}
          onCheckIn={handleCheckIn}
          onNavigateEarn={() => setTab("earn")}
          onNavigateWithdraw={() => setWithdrawOpen(true)}
        />
      )}
      {tab === "earn" && (
        <Earn me={me} rate={rate} tasks={tasks} onClaimTask={handleClaimTask} />
      )}
      {tab === "play" && <Play />}
      {tab === "refer" && (
        <Refer me={me} rate={rate} referralLink={referralLink} leaderboard={leaderboard} />
      )}
      {tab === "account" && (
        <Account
          me={me}
          rate={rate}
          leaderboard={leaderboard}
          onNavigateEarn={() => setTab("earn")}
          onNavigateWithdraw={() => setWithdrawOpen(true)}
          onNavigateRefer={() => setTab("refer")}
          onNavigatePlay={() => setTab("play")}
        />
      )}

      <BottomNav active={tab} onChange={setTab} />

      {withdrawOpen && (
        <WithdrawModal
          balanceShib={me.balance_shib}
          rate={rate.rate}
          minWithdrawShib={MIN_WITHDRAW_SHIB}
          onClose={() => setWithdrawOpen(false)}
          onSubmit={handleWithdraw}
        />
      )}
    </div>
  );
}
