import Link from "next/link";

import { BookmarkToggle } from "@/components/watchlist/bookmark-toggle";
import { confidenceLabel } from "@/lib/lmsr";
import type { MarketCardData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type MarketCardProps = {
  market: MarketCardData;
  readOnly?: boolean;
};

export function MarketCard({ market, readOnly = false }: MarketCardProps) {
  const probability = market.yesPercent / 100;
  const showBookmark = !readOnly && typeof market.isWatchlisted === "boolean";

  return (
    <article
      className={cn(
        "surface p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-blue)]/30",
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="pill">{market.category}</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-semibold text-[var(--ink-muted)]">
            {market.isHot && <span>HOT</span>}
            {market.isNew && <span>NEW</span>}
          </span>
          {showBookmark ? (
            <BookmarkToggle marketId={market.id} initialBookmarked={Boolean(market.isWatchlisted)} compact />
          ) : null}
        </div>
      </div>

      <Link href={`/market/${market.id}`} className={cn("block", readOnly && "pointer-events-none")}>
        <h3 className="line-clamp-2 text-base font-semibold text-[var(--ink)]">{market.title}</h3>
        <p className="mt-2 line-clamp-2 text-xs muted">{market.description}</p>

        <div className="mt-4">
          <div
            className={cn(
              "text-3xl font-extrabold tabular-nums",
              probability >= 0.5 ? "text-[var(--accent-green)]" : "text-[var(--accent-red)]",
            )}
          >
            {market.yesPercent}%
          </div>
          <div className="text-xs muted">{confidenceLabel(probability)}</div>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ebdfd8]">
          <div className="h-full bg-[var(--accent-green)]" style={{ width: `${market.yesPercent}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-[11px] muted">
          <span>{market.volume.toLocaleString()} vol</span>
          <span>{market.comments} comments</span>
          <span>{market.closesIn}</span>
          <span>{market.traderCount} traders</span>
        </div>
      </Link>
    </article>
  );
}
