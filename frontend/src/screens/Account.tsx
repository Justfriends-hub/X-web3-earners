import { useState } from "react";
import { BadgeCheck, Copy, Check, Zap, Wallet, Gift, Gamepad2 } from "lucide-react";
import BalanceCard from "../components/BalanceCard";
import LeaderboardRow from "../components/LeaderboardRow";
import { Me, RateInfo } from "../lib/api";

interface Props {
  me: Me;
  rate: RateInfo;
  leaderboard: { rank: number; username: string; value: number }[];
  onNavigateEarn: () => void;
  onNavigateWithdraw: () => void;
  onNavigateRefer: () => void;
  onNavigatePlay: () => void;
}

export default function Account({
  me,
  rate,
  leaderboard,
  onNavigateEarn,
  onNavigateWithdraw,
  onNavigateRefer,
  onNavigatePlay,
}: Props) {
  const [copiedId, setCopiedId] = useState(false);

  async function handleCopyId() {
    await navigator.clipboard.writeText(String(me.telegram_id));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  }

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <BalanceCard balanceShib={me.balance_shib} rate={rate.rate} rateSource={rate.source} />

      <div className="rounded-card bg-surface border border-border p-4 flex items-center gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-surface-alt flex items-center justify-center text-text-primary font-semibold">
            {me.first_name[0]}
          </div>
          <BadgeCheck
            size={16}
            className="absolute -bottom-0.5 -right-0.5 text-info bg-surface rounded-full"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-medium truncate">{me.first_name}</span>
            <span className="text-[10px] bg-info/20 text-info px-1.5 py-0.5 rounded-pill">
              Telegram
            </span>
          </div>
          {me.username && (
            <div className="text-text-muted text-sm truncate">@{me.username}</div>
          )}
          <button
            onClick={handleCopyId}
            className="flex items-center gap-1 text-text-muted text-xs mt-1"
          >
            ID: {me.telegram_id}
            {copiedId ? <Check size={12} className="text-success" /> : <Copy size={12} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={onNavigateEarn}
          className="rounded-card bg-brand/15 text-brand py-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Zap size={18} />
          <span className="text-xs font-medium">Earn</span>
        </button>
        <button
          onClick={onNavigateWithdraw}
          className="rounded-card bg-success/15 text-success py-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Wallet size={18} />
          <span className="text-xs font-medium">Withdraw</span>
        </button>
        <button
          onClick={onNavigateRefer}
          className="rounded-card bg-special/15 text-special py-3 flex flex-col items-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <Gift size={18} />
          <span className="text-xs font-medium">Refer</span>
        </button>
      </div>

      <button
        onClick={onNavigatePlay}
        className="w-full rounded-card bg-gradient-to-r from-brand to-brand-light p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
      >
        <div className="text-left">
          <div className="text-white font-semibold">Play Games</div>
          <div className="text-white/80 text-xs">Earn SHIB</div>
        </div>
        <Gamepad2 size={26} className="text-white" />
      </button>

      <div>
        <h2 className="text-text-primary font-semibold mb-3">Leaderboard</h2>
        <div className="space-y-2">
          {leaderboard.map((row) => (
            <LeaderboardRow key={row.rank} {...row} />
          ))}
        </div>
      </div>
    </div>
  );
}
