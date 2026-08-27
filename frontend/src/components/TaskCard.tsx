import { useState } from "react";
import { Play, Loader2, Check } from "lucide-react";
import ShibIcon from "./ShibIcon";
import Badge from "./Badge";
import { Task } from "../lib/api";

interface Props {
  task: Task;
  onClaim: (taskId: number) => Promise<void>;
}

export default function TaskCard({ task, onClaim }: Props) {
  const [loading, setLoading] = useState(false);
  const remaining = task.total_slots - task.completed_count;
  const isAdTask = task.category === "ad";

  async function handleClick() {
    if (task.status !== "available" || loading) return;
    setLoading(true);
    try {
      const adUrl = (task as any).url || (isAdTask ? "https://omg10.com/4/11018116" : null);
      if (adUrl) {
        const webApp = (window as any).Telegram?.WebApp;
        if (webApp?.openLink) {
          try { webApp.openLink(adUrl); } catch { window.open(adUrl, "_blank"); }
        } else {
          window.open(adUrl, "_blank");
        }
        // brief pause so the link registers before we credit
        await new Promise((r) => setTimeout(r, 600));
      }
      await onClaim(task.id);
    } finally {
      setLoading(false);
    }
  }

  const buttonLabel = loading
    ? ""
    : task.status === "completed"
    ? "Done"
    : task.status === "exhausted"
    ? "Come back later"
    : isAdTask
    ? "Watch"
    : "Start";

  return (
    <div className="relative rounded-card bg-surface border border-border p-4">
      {task.badge && <Badge type={task.badge} />}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
            {isAdTask ? (
              <Play size={16} className="text-brand" />
            ) : (
              <span className="text-text-primary font-semibold text-sm">
                {task.title[0]}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="text-text-primary font-medium text-sm truncate">
              {task.title}
            </div>
            <div className="flex items-center gap-1 text-text-muted text-xs mt-0.5">
              <ShibIcon size={12} />
              {task.reward_shib} SHIB
            </div>
          </div>
        </div>

        <button
          onClick={handleClick}
          disabled={task.status !== "available" || loading}
          className={`px-4 py-2 rounded-button text-sm font-semibold shrink-0 active:scale-95 transition-transform ${
            task.status === "completed"
              ? "bg-success/20 text-success"
              : task.status === "exhausted"
              ? "bg-surface-alt text-text-muted cursor-not-allowed"
              : "bg-info text-white"
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : task.status === "completed" ? (
            <Check size={16} />
          ) : (
            buttonLabel
          )}
        </button>
      </div>

      {isAdTask && (
        <div className="flex items-center justify-between text-text-muted text-xs mt-3">
          <span>{task.completed_count}/{task.total_slots} completed</span>
          <span>{remaining} remaining</span>
        </div>
      )}
    </div>
  );
}
