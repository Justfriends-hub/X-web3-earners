import { Check, Flame, X } from "lucide-react";

const REWARDS = [10, 15, 20, 30, 40, 50, 100];

interface Props {
  currentDay: number; // 1-7, the day the user is on
  claimedToday: boolean;
  missedStreak: boolean; // true if the streak broke since last visit
  onCheckIn: () => void;
}

export default function CheckInCard({
  currentDay,
  claimedToday,
  missedStreak,
  onCheckIn,
}: Props) {
  return (
    <div className="rounded-card bg-gradient-to-br from-brand to-brand-light p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5 text-white font-semibold">
            <Flame size={16} />
            Daily Check-in
          </div>
          {missedStreak ? (
            <div className="flex items-center gap-1 text-white/90 text-xs mt-0.5">
              <X size={12} />
              Streak reset — back on Day 1
            </div>
          ) : (
            <div className="text-white/90 text-xs mt-0.5">
              Day {currentDay} reward: +{REWARDS[currentDay - 1]} SHIB
            </div>
          )}
        </div>

        <button
          onClick={onCheckIn}
          disabled={claimedToday}
          className={`px-4 py-2 rounded-button text-sm font-semibold active:scale-95 transition-transform ${
            claimedToday
              ? "bg-white/20 text-white/70"
              : "bg-white text-brand"
          }`}
        >
          {claimedToday ? "Claimed" : "Check In"}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {REWARDS.map((reward, i) => {
          const day = i + 1;
          const isClaimed = day < currentDay || (day === currentDay && claimedToday);
          const isToday = day === currentDay && !claimedToday;

          return (
            <div
              key={day}
              className={`rounded-lg py-2 flex flex-col items-center gap-0.5 text-[10px] font-medium ${
                isToday
                  ? "bg-white text-brand ring-2 ring-white"
                  : isClaimed
                  ? "bg-white/25 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {isClaimed ? <Check size={12} /> : `D${day}`}
              <span>{reward}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
