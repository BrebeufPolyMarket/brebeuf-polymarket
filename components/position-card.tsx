"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc("place_binary_sell", {
      p_market_id: marketId,
      p_option_id: optionId,
      p_shares: shares,
      p_client_tx_id: crypto.randomUUID(),
    });

    if (error) {
      setMessage(error.message || "Sell failed.");
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
      <section className="surface p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide ink-soft">Your Position</h3>
        <p className="mt-2 text-sm muted">No open position in this market.</p>
      </section>
    );
  }

  return (
    <section className="surface p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide ink-soft">Your Position</h3>
      <div className="mt-3 space-y-3">
        {positions.map((position) => (
          <div key={position.optionId} className="surface-soft p-3 text-sm ink-soft">
            <p className="font-semibold">
              {position.shares.toFixed(2)} {position.label} shares
            </p>
            <p className="text-xs muted">Avg: {position.avgPrice.toFixed(3)} pts/share</p>
            <p className="text-xs muted">Current value: {Math.floor(position.currentValue)} pts</p>

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
                className="input-clean px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  void onSell(position.optionId);
                }}
                disabled={loadingId === position.optionId}
                className="btn-secondary rounded-lg px-3 py-1 text-xs disabled:opacity-60"
              >
                {loadingId === position.optionId ? "Selling..." : "Sell"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {message ? <p className="mt-3 text-xs ink-soft">{message}</p> : null}
    </section>
  );
}
