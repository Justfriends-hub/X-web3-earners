/**
 * Currency display helpers. Balance is always handled in SHIB — USDT is a
 * derived display value computed from whatever rate the backend returns
 * (live rate if implemented, hardcoded fallback otherwise — see
 * backend/src/rates.ts, which is the single source of truth for the rate).
 */

export type DisplayUnit = "SHIB" | "USDT";

export const REWARD_PER_TASK_SHIB = 0.3;

export function formatBalance(
  shibAmount: number,
  unit: DisplayUnit,
  rate: number
): string {
  if (unit === "SHIB") {
    return `${shibAmount.toLocaleString(undefined, {
      maximumFractionDigits: 1,
    })}`;
  }

  const usdt = shibAmount * rate;
  const decimals = usdt === 0 ? 2 : usdt < 0.01 ? 6 : 2;
  return `$${usdt.toFixed(decimals)}`;
}

export function unitLabel(unit: DisplayUnit): string {
  return unit === "SHIB" ? "SHIB" : "USDT";
}
