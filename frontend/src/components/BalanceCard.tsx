import { useState } from "react";
import { ChevronDown } from "lucide-react";
import ShibIcon from "./ShibIcon";
import { formatBalance, DisplayUnit } from "../lib/currency";

interface Props {
  balanceShib: number;
  rate: number;
  rateSource: "live" | "fallback";
  label?: string;
}

export default function BalanceCard({
  balanceShib,
  rate,
  rateSource,
  label = "Your Balance",
}: Props) {
  const [unit, setUnit] = useState<DisplayUnit>("SHIB");
  const [open, setOpen] = useState(false);

  const primary = formatBalance(balanceShib, unit, rate);
  const secondaryUnit: DisplayUnit = unit === "SHIB" ? "USDT" : "SHIB";
  const secondary = formatBalance(balanceShib, secondaryUnit, rate);

  return (
    <div className="rounded-card bg-surface border border-border p-5 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide mb-2">
          {label}
          {rateSource === "fallback" && (
            <span
              title="Live rate unavailable — showing last known SHIB/USDT rate"
              className="w-1.5 h-1.5 rounded-full bg-gold"
            />
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-text-primary tracking-tight">
            {primary}
          </span>

          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-0.5 text-text-muted text-sm active:scale-95 transition-transform"
          >
            {unit}
            <ChevronDown size={14} />
          </button>
        </div>

        {open && (
          <div className="mt-2 flex gap-2">
            {(["SHIB", "USDT"] as DisplayUnit[]).map((u) => (
              <button
                key={u}
                onClick={() => {
                  setUnit(u);
                  setOpen(false);
                }}
                className={`px-3 py-1 rounded-pill text-xs font-medium transition-colors ${
                  unit === u
                    ? "bg-brand text-white"
                    : "bg-surface-alt text-text-muted"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        )}

        <div className="text-text-muted text-sm mt-1">
          ≈ {secondary} {secondaryUnit}
        </div>
      </div>

      <ShibIcon size={48} className="text-2xl shrink-0" />
    </div>
  );
}
