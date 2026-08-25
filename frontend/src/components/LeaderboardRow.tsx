import { Crown, Medal, Users } from "lucide-react";

interface Props {
  rank: number;
  username: string;
  value: number;
}

export default function LeaderboardRow({ rank, username, value }: Props) {
  const isFirst = rank === 1;
  const isMedal = rank === 2 || rank === 3;

  return (
    <div
      className={`flex items-center justify-between rounded-card border px-4 py-3 ${
        isFirst
          ? "bg-gold/10 border-gold/40"
          : "bg-surface border-border"
      }`}
    >
      <div className="flex items-center gap-3">
        {isFirst ? (
          <Crown size={18} className="text-gold" />
        ) : isMedal ? (
          <Medal size={18} className="text-text-muted" />
        ) : (
          <span className="text-text-muted text-sm font-medium w-[18px] text-center">
            #{rank}
          </span>
        )}
        <span className="text-text-primary font-medium text-sm">{username}</span>
      </div>

      <div className="flex items-center gap-1 text-text-muted text-sm">
        <Users size={14} />
        {value.toLocaleString()}
      </div>
    </div>
  );
}
