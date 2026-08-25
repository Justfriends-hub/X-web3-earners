import { useState } from "react";
import { X, Wallet } from "lucide-react";
import { formatBalance } from "../lib/currency";

interface Props {
  balanceShib: number;
  rate: number;
  minWithdrawShib: number;
  onClose: () => void;
  onSubmit: (amountShib: number) => Promise<void>;
}

export default function WithdrawModal({
  balanceShib,
  rate,
  minWithdrawShib,
  onClose,
  onSubmit,
}: Props) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const numAmount = Number(amount);
  const canSubmit =
    numAmount > 0 && numAmount <= balanceShib && numAmount >= minWithdrawShib;

  async function handleSubmit() {
    setError(null);
    if (!canSubmit) {
      setError(
        numAmount < minWithdrawShib
          ? `Minimum withdrawal is ${minWithdrawShib} SHIB`
          : "Amount exceeds your balance"
      );
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(numAmount);
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60">
      <div className="w-full max-w-md bg-surface rounded-t-card p-5 safe-bottom">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-semibold text-lg">Withdraw</h2>
          <button onClick={onClose} className="text-text-muted">
            <X size={20} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-success/20 text-success flex items-center justify-center mx-auto mb-3">
              <Wallet size={22} />
            </div>
            <p className="text-text-primary font-medium mb-1">Request submitted</p>
            <p className="text-text-muted text-sm mb-4">
              An admin will review and pay this out manually. You'll see the status
              update once it's processed.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-brand text-white font-medium py-2.5 rounded-button"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-text-muted text-sm mb-3">
              Available: {formatBalance(balanceShib, "SHIB", rate)} SHIB (≈
              {formatBalance(balanceShib, "USDT", rate)})
            </p>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min. ${minWithdrawShib} SHIB`}
              className="w-full bg-surface-alt border border-border rounded-button px-4 py-3 text-text-primary mb-2 outline-none focus:ring-2 focus:ring-brand"
            />

            {error && <p className="text-destructive text-xs mb-2">{error}</p>}

            <p className="text-text-muted text-xs mb-4">
              Payouts are reviewed manually and settled via Shibarium / BSC — not
              Ethereum mainnet, to keep gas fees below the payout value.
            </p>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-brand text-white font-medium py-3 rounded-button active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Request Withdrawal"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
