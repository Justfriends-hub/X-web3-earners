import { ListChecks, Flame, Users, Zap, Wallet } from "lucide-react";
import BalanceCard from "../components/BalanceCard";
import StatChip from "../components/StatChip";
import CheckInCard from "../components/CheckInCard";
import TaskCard from "../components/TaskCard";
import { Me, RateInfo, Task } from "../lib/api";

interface Props {
  me: Me;
  rate: RateInfo;
  tasks: Task[];
  onClaimTask: (id: number) => Promise<void>;
  onCheckIn: () => void;
  onNavigateEarn: () => void;
  onNavigateWithdraw: () => void;
}

export default function Home({
  me,
  rate,
  tasks,
  onClaimTask,
  onCheckIn,
  onNavigateEarn,
  onNavigateWithdraw,
}: Props) {
  const spotlightTasks = tasks.filter((t) => t.category === "ad").slice(0, 2);
  const featuredTasks = tasks.filter((t) => t.category === "offer").slice(0, 2);

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <BalanceCard
        balanceShib={me.balance_shib}
        rate={rate.rate}
        rateSource={rate.source}
        label="Your Balance"
      />

      <div className="flex gap-3">
        <button
          onClick={onNavigateEarn}
          className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-semibold py-3 rounded-button active:scale-[0.98] transition-transform"
        >
          <Zap size={16} />
          Earn
        </button>
        <button
          onClick={onNavigateWithdraw}
          className="flex-1 flex items-center justify-center gap-2 bg-surface border border-border text-text-primary font-semibold py-3 rounded-button active:scale-[0.98] transition-transform"
        >
          <Wallet size={16} />
          Withdraw
        </button>
      </div>

      <div className="flex gap-3">
        <StatChip icon={ListChecks} label="Tasks" value={`${me.tasks_completed}/15`} />
        <StatChip icon={Flame} label="Streak" value={me.streak} accent="text-gold" />
        <StatChip icon={Users} label="Refs" value={me.referrals} accent="text-info" />
      </div>

      <CheckInCard
        currentDay={Math.min(me.streak + 1, 7)}
        claimedToday={false}
        missedStreak={false}
        onCheckIn={onCheckIn}
      />

      <div>
        <h2 className="text-text-primary font-semibold mb-3">Watch Ads & Earn</h2>
        <div className="space-y-3">
          {spotlightTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={onClaimTask} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-primary font-semibold">Featured Tasks</h2>
          <button onClick={onNavigateEarn} className="text-brand text-sm font-medium">
            All →
          </button>
        </div>
        <div className="space-y-3">
          {featuredTasks.map((task) => (
            <TaskCard key={task.id} task={task} onClaim={onClaimTask} />
          ))}
        </div>
      </div>
    </div>
  );
}
