"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { sharesToReceive } from "@/lib/lmsr";

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

    const response = await fetch("/api/bet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        optionId: isYes ? yesOptionId : noOptionId,
        points,
        clientTxId: crypto.randomUUID(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.message ?? "Bet failed.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Bet placed.");
    setIsSubmitting(false);
    router.refresh();
  }

  if (userStatus !== "active") {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#151723] p-5">
        <h2 className="text-lg font-bold text-white">Place Bet</h2>
        <p className="mt-2 text-sm text-zinc-400">Sign in with an approved active account to place bets.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#151723] p-5">
      <h2 className="text-lg font-bold text-white">Place Bet</h2>
      <p className="mt-1 text-xs text-zinc-400">Balance: {pointsBalance.toLocaleString()} pts</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSide("YES")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            side === "YES" ? "bg-emerald-500 text-[#04170f]" : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          YES
        </button>
        <button
          type="button"
          onClick={() => setSide("NO")}
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            side === "NO" ? "bg-rose-500 text-[#29070d]" : "bg-rose-500/20 text-rose-300"
          }`}
        >
          NO
        </button>
      </div>

      <label className="mt-4 block text-xs text-zinc-300" htmlFor="bet-amount">
        Amount (points)
      </label>
      <input
        id="bet-amount"
        type="number"
        min={1}
        step={1}
        value={points}
        onChange={(event) => setPoints(Number(event.target.value || 0))}
        className="mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none ring-emerald-400/40 focus:ring"
      />

      <div className="mt-4 rounded-lg bg-white/5 p-3 text-xs text-zinc-300">
        <p>You get ~{shares.toFixed(2)} shares</p>
        <p>If {side} wins: +{projectedPayout} pts</p>
        <p>Fee: {feePoints} pts</p>
      </div>

      {message ? <p className="mt-3 text-xs text-zinc-300">{message}</p> : null}

      <button
        type="button"
        disabled={!canBet}
        onClick={() => {
          void submitBet();
        }}
        className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-[#07140f] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Placing Bet..." : "Place Bet"}
      </button>
    </div>
  );
}
