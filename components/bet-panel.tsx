"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { sharesToReceive } from "@/lib/lmsr";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type BetPanelProps = {
  marketId: string;
  yesOptionId: string;
  noOptionId: string;
  qYes: number;
  qNo: number;
  b: number;
  feeRate: number;
  userStatus: "pending" | "active" | "banned" | "anon";
  pointsBalance: number;
};

export function BetPanel({
  marketId,
  yesOptionId,
  noOptionId,
  qYes,
  qNo,
  b,
  feeRate,
  userStatus,
  pointsBalance,
}: BetPanelProps) {
  const router = useRouter();
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [points, setPoints] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const feePoints = Math.floor(points * feeRate);
  const netPoints = Math.max(0, points - feePoints);
  const isYes = side === "YES";

  const shares = useMemo(() => {
    if (netPoints <= 0) return 0;
    return sharesToReceive(qYes, qNo, netPoints, b, isYes);
  }, [netPoints, qYes, qNo, b, isYes]);

  const projectedPayout = Math.floor(shares);

  const canBet = userStatus === "active" && points > 0 && points <= pointsBalance && !isSubmitting;

  async function submitBet() {
    if (!canBet) return;

    setIsSubmitting(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("place_binary_bet", {
      p_market_id: marketId,
      p_option_id: isYes ? yesOptionId : noOptionId,
      p_points: points,
      p_client_tx_id: crypto.randomUUID(),
    });

    if (error) {
      setMessage(error.message || "Bet failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Bet placed.");
    setIsSubmitting(false);
    router.refresh();
  }

  if (userStatus !== "active") {
    return (
      <div className="surface p-5">
        <h2 className="text-lg font-bold text-[var(--ink)]">Place Bet</h2>
        <p className="mt-2 text-sm muted">Sign in with an approved active account to place bets.</p>
      </div>
    );
  }

  return (
    <div className="surface p-5">
      <h2 className="text-lg font-bold text-[var(--ink)]">Place Bet</h2>
      <p className="mt-1 text-xs muted">Balance: {pointsBalance.toLocaleString()} pts</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("YES")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            side === "YES" ? "bg-[var(--accent-green)] text-white" : "bg-[#e3f3eb] text-[#0f6f44]"
          }`}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setSide("NO")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            side === "NO" ? "bg-[var(--accent-red)] text-white" : "bg-[#f9e4df] text-[#9b3820]"
          }`}
        >
          NO
        </button>
      </div>

      <label className="mt-4 block text-xs ink-soft" htmlFor="bet-amount">
        Amount (points)
      </label>
      <input
        id="bet-amount"
        type="number"
        min={1}
        step={1}
        value={points}
        onChange={(event) => setPoints(Number(event.target.value || 0))}
        className="input-clean mt-1"
      />

      <div className="surface-soft mt-4 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] muted">Trade Summary</p>
        <dl className="mt-2 space-y-1 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="ink-soft">Estimated shares</dt>
            <dd className="tabular-nums font-semibold text-[var(--ink)]">{shares.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="ink-soft">Payout if {side} wins</dt>
            <dd className="tabular-nums font-semibold text-[var(--ink)]">+{projectedPayout} pts</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="ink-soft">Platform fee ({Math.round(feeRate * 100)}%)</dt>
            <dd className="tabular-nums font-semibold text-[var(--ink)]">{feePoints} pts</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="ink-soft">Net points used</dt>
            <dd className="tabular-nums font-semibold text-[var(--ink)]">{netPoints} pts</dd>
          </div>
        </dl>
        <p className="mt-2 text-[11px] muted">Payouts are rounded down to whole points.</p>
      </div>

      {message ? <p className="mt-3 text-xs ink-soft">{message}</p> : null}

      <button
        type="button"
        disabled={!canBet}
        onClick={() => {
          void submitBet();
        }}
        className="btn-primary mt-4 w-full px-4 py-3 text-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Placing Bet..." : "Place Bet"}
      </button>
    </div>
  );
}
