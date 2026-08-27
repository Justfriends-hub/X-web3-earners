import { useState } from "react";

interface Props {
  onJoin: () => void;
  onClaim: () => Promise<void>;
  onClose: () => void;
}

const CHANNEL_URL = "https://t.me/+le568K96UC1iZWRk";

export default function WelcomeBonusModal({ onJoin, onClaim, onClose }: Props) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  async function handleClaim() {
    setClaiming(true);
    setError(null);
    try {
      await onClaim();
      setClaimed(true);
      setTimeout(onClose, 1800);
    } catch (e: any) {
      setError(e?.message || "Please join the channel first, then try again.");
    } finally {
      setClaiming(false);
    }
  }

  function handleJoin() {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(CHANNEL_URL);
    } else {
      window.open(CHANNEL_URL, "_blank");
    }
    onJoin();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border border-border rounded-card p-6 text-center shadow-2xl animate-[scaleIn_0.25s_ease]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-brand to-brand-light flex items-center justify-center text-3xl">
          🎁
        </div>

        <h2 className="text-text-primary font-display text-xl font-bold mb-1">
          Claim 30,000 SHIB
        </h2>
        <p className="text-brand font-semibold text-sm mb-3">Welcome Bonus</p>

        <p className="text-text-muted text-sm mb-5 leading-relaxed">
          Join our official Telegram channel to unlock your <span className="text-text-primary font-semibold">30,000 SHIB</span> welcome bonus. One-time only for new users.
        </p>

        {claimed ? (
          <div className="bg-success/15 border border-success/30 rounded-button p-4 mb-4">
            <div className="text-success font-bold">✓ Bonus Claimed!</div>
            <div className="text-success/80 text-sm">30,000 SHIB added to your balance</div>
          </div>
        ) : (
          <>
            <button
              onClick={handleJoin}
              className="w-full bg-brand hover:bg-brand-light text-white font-semibold py-3 rounded-button flex items-center justify-center gap-2 mb-3 active:scale-[0.98] transition-all"
            >
              <span className="text-lg">📢</span> Join Channel
            </button>

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-surface-alt border border-border text-text-primary font-medium py-3 rounded-button disabled:opacity-50 active:scale-[0.98] transition-all"
            >
              {claiming ? "Verifying..." : "Verify & Claim 30,000 SHIB"}
            </button>

            {error && <div className="mt-3 text-destructive text-xs bg-destructive/10 border border-destructive/20 rounded-lg p-2">{error}</div>}

            <p className="text-text-muted text-[11px] mt-3">You must be a member of the channel to claim.</p>
          </>
        )}

        <button onClick={onClose} className="mt-4 text-text-muted text-xs underline">
          Maybe later
        </button>
      </div>

      <style>{`@keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
    </div>
  );
}
