import { useEffect, useState } from "react";
import { Play, Loader2, Check, Clock, X } from "lucide-react";
import ShibIcon from "./ShibIcon";
import Badge from "./Badge";
import { Task } from "../lib/api";

interface Props {
  task: Task;
  onClaim: (taskId: number) => Promise<void>;
}

const REQUIRED_SECONDS = 10;

export default function TaskCard({ task, onClaim }: Props) {
  const [loading, setLoading] = useState(false);
  const [viewedAt, setViewedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [popup, setPopup] = useState<{ spent: number; remaining: number } | null>(null);
  const [showAd, setShowAd] = useState(false);
  const remaining = task.total_slots - task.completed_count;
  const isAdTask = task.category === "ad";

  // tick every 200ms while waiting so countdown feels live
  useEffect(() => {
    if (viewedAt === null || task.status !== "available") return;
    const elapsed = (Date.now() - viewedAt) / 1000;
    if (elapsed >= REQUIRED_SECONDS) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [viewedAt, task.status]);

  const elapsedSec = viewedAt ? (now - viewedAt) / 1000 : 0;
  const waitRemaining = viewedAt ? Math.max(0, REQUIRED_SECONDS - elapsedSec) : 0;

  async function handleClick() {
    if (task.status !== "available" || loading) return;

    const adUrl = (task as any).url || (isAdTask ? "https://omg10.com/4/11018116" : null);

    // Ad tasks: enforce 10s dwell — always stay inside Telegram
    if (isAdTask && adUrl) {
      if (viewedAt === null) {
        // first click — open in-app viewer, start timer, don't claim yet
        setShowAd(true);
        const t = Date.now();
        setViewedAt(t);
        setNow(t);
        setPopup(null);
        return;
      }

      const elapsed = (Date.now() - viewedAt) / 1000;
      if (elapsed < REQUIRED_SECONDS) {
        setPopup({ spent: elapsed, remaining: REQUIRED_SECONDS - elapsed });
        // keep the in-app viewer open so they don't leave
        setShowAd(true);
        return;
      }
      // 10s passed — fall through to claim
    } else if (adUrl && !isAdTask) {
      // Offer tasks: open inside Telegram as well
      setShowAd(true);
      const t = Date.now();
      if (viewedAt === null) {
        setViewedAt(t);
        setNow(t);
        return;
      }
      // offer tasks have no 10s gate — fall through after viewer
      await new Promise((r) => setTimeout(r, 300));
    }

    setLoading(true);
    try {
      await onClaim(task.id);
      setViewedAt(null);
      setShowAd(false);
      setPopup(null);
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
    ? viewedAt === null
      ? "Watch"
      : waitRemaining > 0
      ? `Wait ${Math.ceil(waitRemaining)}s`
      : "Claim"
    : "Start";

  const adUrl = (task as any).url || (isAdTask ? "https://omg10.com/4/11018116" : null);

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
          disabled={task.status !== "available" || loading || (isAdTask && viewedAt !== null && waitRemaining > 0)}
          className={`px-4 py-2 rounded-button text-sm font-semibold shrink-0 active:scale-95 transition-transform flex items-center gap-1.5 ${
            task.status === "completed"
              ? "bg-success/20 text-success"
              : task.status === "exhausted"
              ? "bg-surface-alt text-text-muted cursor-not-allowed"
              : isAdTask && viewedAt !== null && waitRemaining > 0
              ? "bg-surface-alt text-text-muted cursor-not-allowed"
              : "bg-info text-white"
          }`}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isAdTask && viewedAt !== null && waitRemaining > 0 ? (
            <>
              <Clock size={14} /> {buttonLabel}
            </>
          ) : task.status === "completed" ? (
            <Check size={16} />
          ) : (
            buttonLabel
          )}
        </button>
      </div>

      {isAdTask && viewedAt !== null && waitRemaining > 0 && task.status === "available" && (
        <div className="mt-3 text-brand text-xs flex items-center gap-1.5 bg-brand/10 border border-brand/20 rounded-lg px-3 py-2">
          <Clock size={12} /> Ad opened inside Telegram — stay {Math.ceil(waitRemaining)}s more, then tap Claim
        </div>
      )}

      {isAdTask && (
        <div className="flex items-center justify-between text-text-muted text-xs mt-3">
          <span>{task.completed_count}/{task.total_slots} completed</span>
          <span>{remaining} remaining</span>
        </div>
      )}

      {popup && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPopup(null)}>
          <div className="w-full max-w-xs bg-surface border border-border rounded-card p-5 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-destructive/15 flex items-center justify-center">
              <Clock size={22} className="text-destructive" />
            </div>
            <div className="text-text-primary font-semibold mb-1">Not enough time</div>
            <p className="text-text-muted text-sm mb-4">
              You spent <span className="text-text-primary font-semibold">{popup.spent.toFixed(1)}s</span> — you need <span className="text-text-primary font-semibold">10.0s</span>.<br />
              Please wait <span className="text-brand font-bold">{popup.remaining.toFixed(1)}s</span> more, then tap Claim again.
            </p>
            <button onClick={() => setPopup(null)} className="w-full bg-brand text-white font-semibold py-2.5 rounded-button active:scale-[0.98] transition-transform">
              Got it — keep watching
            </button>
          </div>
        </div>
      )}

      {showAd && adUrl && (
        <div className="fixed inset-0 z-[90] bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-border safe-top shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Clock size={16} className={waitRemaining > 0 ? "text-brand" : "text-success"} />
              <span className="text-text-primary text-sm font-medium truncate">
                {waitRemaining > 0 ? `Stay ${Math.ceil(waitRemaining)}s to claim` : "You can claim now"}
              </span>
            </div>
            <button
              onClick={() => setShowAd(false)}
              className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-text-muted"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 relative bg-white">
            <iframe
              src={adUrl}
              title="Ad"
              className="absolute inset-0 w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
              allow="autoplay; fullscreen"
            />
            {waitRemaining > 0 && (
              <div className="absolute bottom-4 left-4 right-4 bg-surface border border-border rounded-card p-3 flex items-center justify-between gap-3 shadow-xl">
                <span className="text-text-muted text-xs">Keep this open — {Math.ceil(waitRemaining)}s left</span>
                <span className="text-brand font-bold text-sm">{Math.ceil(waitRemaining)}s</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-surface border-t border-border safe-bottom shrink-0">
            <button
              onClick={async () => {
                const elapsed = viewedAt ? (Date.now() - viewedAt) / 1000 : 0;
                if (elapsed < REQUIRED_SECONDS) {
                  setPopup({ spent: elapsed, remaining: REQUIRED_SECONDS - elapsed });
                  return;
                }
                setLoading(true);
                try {
                  await onClaim(task.id);
                  setViewedAt(null);
                  setShowAd(false);
                  setPopup(null);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={waitRemaining > 0 || loading}
              className={`w-full py-3 rounded-button font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${
                waitRemaining > 0 ? "bg-surface-alt text-text-muted" : "bg-brand text-white"
              }`}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : waitRemaining > 0 ? <><Clock size={16} /> Wait {Math.ceil(waitRemaining)}s</> : <><Check size={16} /> Claim {task.reward_shib} SHIB</>}
            </button>
            <p className="text-center text-text-muted text-[11px] mt-2">Never leaves Telegram • Ad stays inside the app</p>
          </div>
        </div>
      )}
    </div>
  );
}
