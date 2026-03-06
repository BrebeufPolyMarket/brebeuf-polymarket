import Link from "next/link";
import { Trophy } from "lucide-react";

import { HOUSE_CONFIG } from "@/lib/houses";
import type { HouseStandingData } from "@/lib/data/types";
import { cn } from "@/lib/utils";

type HouseCupWidgetProps = {
  houses: HouseStandingData[];
  className?: string;
};

export function HouseCupWidget({ houses, className }: HouseCupWidgetProps) {
  const sorted = [...houses].sort((a, b) => a.rank - b.rank);
  const maxPoints = sorted.length ? Math.max(...sorted.map((house) => house.totalPoints), 1) : 1;

  return (
    <Link
      href="/leaderboard#house-cup"
      className={cn("surface block p-4 transition hover:-translate-y-0.5", className)}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--ink)]">House Cup Standings</h3>
        <Trophy className="h-4 w-4 text-[var(--accent-gold)]" />
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? <p className="text-xs muted">No house standings yet.</p> : null}
        {sorted.map((standing) => {
          const house = HOUSE_CONFIG[standing.house];
          const width = Math.max(8, Math.round((standing.totalPoints / maxPoints) * 100));
          const isLeader = standing.rank === 1;

          return (
            <div
              key={standing.house}
              className={cn(
                "surface-soft rounded-xl border px-3 py-2",
                isLeader && "border-[var(--accent-gold)]/55 bg-[color-mix(in_srgb,#fff_70%,#f4e6da_30%)]",
              )}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: house.colourHex }}>
                  #{standing.rank} {house.displayName}
                </span>
                <span className="ink-soft">{standing.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="h-2 rounded-full bg-[#e9dfd8]">
                <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: house.colourHex }} />
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
