import Link from "next/link";

import { confidenceLabel } from "@/lib/lmsr";
import type { MarketCardData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type MarketCardProps = {
  market: MarketCardData;
  readOnly?: boolean;
};

export function MarketCard({ market, readOnly = false }: MarketCardProps) {
  const probability = market.yesPercent / 100;

  return (
    <Link
      href={`/market/${market.id}`}
      className={cn(
        "rounded-2xl border border-white/10 bg-[#151723] p-4 transition hover:border-white/20",
        readOnly && "pointer-events-none",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-zinc-200">{market.category}</span>
        <span className="flex items-center gap-1 text-[11px] text-zinc-300">
          {market.isHot && <span>HOT</span>}
          {market.isNew && <span>NEW</span>}
        </span>
      </div>

      <h3 className="line-clamp-2 text-base font-semibold text-white">{market.title}</h3>
      <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{market.description}</p>

      <div className="mt-4">
        <div className={cn("text-3xl font-extrabold tabular-nums", probability >= 0.5 ? "text-emerald-400" : "text-rose-400")}>
          {market.yesPercent}%
        </div>
        <div className="text-xs text-zinc-400">{confidenceLabel(probability)}</div>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-rose-400/20">
        <div className="h-full bg-emerald-400" style={{ width: `${market.yesPercent}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] text-zinc-400">
        <span>{market.volume.toLocaleString()} vol</span>
        <span>{market.comments} comments</span>
        <span>{market.closesIn}</span>
        <span>{market.traderCount} traders</span>
      </div>
    </Link>
  );
}
