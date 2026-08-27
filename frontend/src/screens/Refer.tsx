import { useState } from "react";
import { Copy, Check, Share2, Rocket, Gift } from "lucide-react";
import BalanceCard from "../components/BalanceCard";
import ShibIcon from "../components/ShibIcon";
import LeaderboardRow from "../components/LeaderboardRow";
import { Me, RateInfo } from "../lib/api";

interface Props {
  me: Me;
  rate: RateInfo;
  referralLink: string;
  leaderboard: { rank: number; username: string; value: number }[];
}

const REFERRAL_REWARD_SHIB = 2500;

export default function Refer({ me, rate, referralLink, leaderboard }: Props) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"referral" | "earners" | "event">("referral");

  async function handleCopy() {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleShare() {
    const webApp = (window as any).Telegram?.WebApp;
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(referralLink)}`
      );
    } else {
      handleCopy();
    }
  }

  return (
    <div className="px-4 pt-4 pb-28 space-y-4">
      <BalanceCard balanceShib={me.balance_shib} rate={rate.rate} rateSource={rate.source} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary font-display text-2xl font-bold">Referral</h1>
          <p className="text-text-muted text-sm">Invite friends, earn SHIB</p>
        </div>
      </div>

      <div className="rounded-card bg-gradient-to-br from-brand to-brand-light p-4 flex items-start gap-3">
        <Rocket size={22} className="text-white shrink-0 mt-0.5" />
        <div>
          <div className="text-white font-semibold mb-0.5">Unlimited Earnings</div>
          <p className="text-white/90 text-sm">
            No limits. The more friends you invite, the more SHIB you earn — forever.
          </p>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border p-4 flex items-center gap-3">
        <Gift size={18} className="text-brand" />
        <div className="flex-1">
          <div className="text-text-primary text-sm font-medium">Invite & Earn</div>
          <div className="text-text-muted text-xs">
            Get {REFERRAL_REWARD_SHIB.toLocaleString()} SHIB per successful referral
          </div>
        </div>
        <ShibIcon size={22} />
      </div>

      <div className="flex gap-3">
        <div className="flex-1 rounded-card bg-surface border border-border p-3 text-center">
          <div className="text-text-muted text-xs">Total Referrals</div>
          <div className="text-text-primary font-semibold text-lg">{me.referrals}</div>
        </div>
        <div className="flex-1 rounded-card bg-surface border border-border p-3 text-center">
          <div className="text-text-muted text-xs">Earned</div>
          <div className="text-text-primary font-semibold text-lg">
            +{(me.referrals * REFERRAL_REWARD_SHIB).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border p-4">
        <div className="text-text-muted text-xs mb-1.5">Your Referral Link</div>
        <div className="bg-surface-alt rounded-button px-3 py-2 text-text-primary text-sm truncate mb-3">
          {referralLink}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-brand text-white font-medium py-2.5 rounded-button active:scale-[0.98] transition-transform"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-alt border border-border text-text-primary font-medium py-2.5 rounded-button active:scale-[0.98] transition-transform"
          >
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>

      <div className="rounded-card bg-surface border border-border p-4 space-y-2">
        <div className="text-text-primary font-medium text-sm mb-1">How it works</div>
        {[
          "Share your referral link with friends",
          "They open the app using your link",
          `You earn ${REFERRAL_REWARD_SHIB.toLocaleString()} SHIB per successful referral`,
        ].map((step) => (
          <div key={step} className="flex items-center gap-2 text-text-muted text-sm">
            <Check size={14} className="text-success shrink-0" />
            {step}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-text-primary font-semibold">Leaderboard</h2>
            <p className="text-text-muted text-xs">Top users globally</p>
          </div>
          <span className="flex items-center gap-1 text-success text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </div>

        <div className="flex gap-2 mb-3">
          {(["referral", "earners", "event"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium ${
                tab === t ? "bg-brand text-white" : "bg-surface-alt text-text-muted"
              }`}
            >
              {t === "referral" ? "Top Referral" : t === "earners" ? "Top Earners" : "Referral Event"}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {leaderboard.some((r) => r.value >= 100) ? (
            leaderboard
              .filter((r) => r.value >= 100)
              .map((row) => <LeaderboardRow key={row.rank} {...row} />)
          ) : (
            <div className="rounded-card bg-surface border border-border p-8 text-center space-y-2">
              <div className="text-text-primary font-semibold">Leaderboard — Coming Soon</div>
              <p className="text-text-muted text-sm">
                The board unlocks once a user reaches 100 referrals. Keep inviting!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
