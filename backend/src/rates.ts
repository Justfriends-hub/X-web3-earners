/**
 * SHIB/USDT rate source. Same seam described in the design spec: try live,
 * fall back to a manually-set hardcoded value if the live call fails or
 * isn't implemented yet. This is the ONLY file that needs to change when
 * you add a real price feed.
 */

export const SHIB_USDT_FALLBACK_RATE = 0.00000445; // manually set 2026-08-25

export interface RateResult {
  rate: number;
  source: "live" | "fallback";
}

export async function getShibRate(): Promise<RateResult> {
  try {
    const live = await fetchLiveShibRate();
    if (live && live > 0) {
      return { rate: live, source: "live" };
    }
  } catch {
    // fall through to fallback
  }
  return { rate: SHIB_USDT_FALLBACK_RATE, source: "fallback" };
}

/**
 * Not implemented yet. When ready, replace this with e.g.:
 *
 *   const res = await fetch(
 *     "https://api.coingecko.com/api/v3/simple/price?ids=shiba-inu&vs_currencies=usdt"
 *   );
 *   const data = await res.json();
 *   return data["shiba-inu"].usdt;
 *
 * Nothing else in the app needs to change — getShibRate() handles the
 * fallback automatically if this throws or returns an invalid value.
 */
async function fetchLiveShibRate(): Promise<number> {
  throw new Error("Live rate API not implemented yet");
}
