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
      className={cn(
        "block rounded-2xl border border-white/10 bg-[#151723] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] transition hover:border-white/20",
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">House Cup Standings</h3>
        <Trophy className="h-4 w-4 text-amber-300" />
      </div>

      <div className="space-y-3">
        {sorted.length === 0 ? <p className="text-xs text-zinc-400">No house standings yet.</p> : null}
        {sorted.map((standing) => {
          const house = HOUSE_CONFIG[standing.house];
          const width = Math.max(8, Math.round((standing.totalPoints / maxPoints) * 100));
          const isLeader = standing.rank === 1;

          return (
            <div
              key={standing.house}
              className={cn(
                "rounded-xl border border-transparent px-3 py-2",
                isLeader && "border-amber-300/70 bg-amber-300/5",
              )}
            >
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-semibold" style={{ color: house.colourHex }}>
                  #{standing.rank} {house.displayName}
                </span>
                <span className="text-zinc-300">{standing.totalPoints.toLocaleString()} pts</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${width}%`, backgroundColor: house.colourHex }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
