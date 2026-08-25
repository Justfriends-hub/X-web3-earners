import { useState } from "react";
import BalanceCard from "../components/BalanceCard";
import TaskCard from "../components/TaskCard";
import { Me, RateInfo, Task } from "../lib/api";

interface Props {
  me: Me;
  rate: RateInfo;
  tasks: Task[];
  onClaimTask: (id: number) => Promise<void>;
}

const FILTERS = ["All", "Ads", "Others", "Discord", "YouTube"];

export default function Earn({ me, rate, tasks, onClaimTask }: Props) {
  const [filter, setFilter] = useState("All");

  const adTasks = tasks.filter((t) => t.category === "ad");
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const adCompleted = adTasks.reduce((sum, t) => sum + t.completed_count, 0);
  const adTotal = adTasks.reduce((sum, t) => sum + t.total_slots, 0);

  const filtered =
    filter === "All"
      ? tasks
      : filter === "Ads"
      ? adTasks
      : tasks.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <h1 className="text-text-primary font-display text-2xl font-bold">Earn SHIB</h1>

      <BalanceCard
        balanceShib={me.balance_shib}
        rate={rate.rate}
        rateSource={rate.source}
        label="Your Balance"
      />

      <div className="flex items-center justify-between text-text-muted text-xs">
        <span>{completedCount} completed • {tasks.length - completedCount} available</span>
        <span>{adCompleted}/{adTotal} ads • {adTotal - adCompleted} left</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-pill text-sm font-medium transition-colors ${
              filter === f
                ? "bg-brand text-white"
                : "bg-surface border border-border text-text-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((task) => (
          <TaskCard key={task.id} task={task} onClaim={onClaimTask} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center text-text-muted text-sm py-10">
            No tasks in this category right now — check back soon.
          </div>
        )}
      </div>
    </div>
  );
}
