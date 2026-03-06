"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Position = {
  optionId: string;
  label: string;
  shares: number;
  avgPrice: number;
  currentValue: number;
  realizedPnl: number;
};

type PositionCardProps = {
  marketId: string;
  positions: Position[];
};

export function PositionCard({ marketId, positions }: PositionCardProps) {
  const router = useRouter();
  const [sellByOptionId, setSellByOptionId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function onSell(optionId: string) {
    const rawShares = sellByOptionId[optionId] ?? "";
    const shares = Number(rawShares);

    if (!Number.isFinite(shares) || shares <= 0) {
      setMessage("Enter a valid share amount.");
      return;
    }

    setLoadingId(optionId);
    setMessage(null);

    const response = await fetch("/api/sell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        marketId,
        optionId,
        shares,
        clientTxId: crypto.randomUUID(),
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setMessage(data?.message ?? "Sell failed.");
      setLoadingId(null);
      return;
    }

    setMessage("Sell executed.");
    setLoadingId(null);
    setSellByOptionId((prev) => ({ ...prev, [optionId]: "" }));
    router.refresh();
  }

  if (!positions.length) {
    return (
      <section className="rounded-2xl border border-white/10 bg-[#151723] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Your Position</h3>
        <p className="mt-2 text-sm text-zinc-400">No open position in this market.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#151723] p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Your Position</h3>
      <div className="mt-3 space-y-3">
        {positions.map((position) => (
          <div key={position.optionId} className="rounded-xl bg-white/5 p-3 text-sm text-zinc-200">
            <p className="font-semibold">
              {position.shares.toFixed(2)} {position.label} shares
            </p>
            <p className="text-xs text-zinc-400">Avg: {position.avgPrice.toFixed(3)} pts/share</p>
            <p className="text-xs text-zinc-400">Current value: {Math.floor(position.currentValue)} pts</p>

            <div className="mt-2 flex gap-2">
              <input
                type="number"
                min={0}
                max={position.shares}
                step="0.01"
                value={sellByOptionId[position.optionId] ?? ""}
                onChange={(event) =>
                  setSellByOptionId((prev) => ({
                    ...prev,
                    [position.optionId]: event.target.value,
                  }))
                }
                placeholder="Shares to sell"
                className="w-full rounded-lg border border-white/15 bg-black/30 px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  void onSell(position.optionId);
                }}
                disabled={loadingId === position.optionId}
                className="rounded-lg bg-amber-400 px-3 py-1 text-xs font-semibold text-[#1B1F3A] disabled:opacity-60"
              >
                {loadingId === position.optionId ? "Selling..." : "Sell"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {message ? <p className="mt-3 text-xs text-zinc-300">{message}</p> : null}
    </section>
  );
}
