import Link from "next/link";

import { HouseBadge } from "@/components/house-badge";
import type { LiveActivityItem } from "@/lib/data/types";

type LiveActivityPanelProps = {
  items: LiveActivityItem[];
};

export function LiveActivityPanel({ items }: LiveActivityPanelProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#151723] p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">Live Activity</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white/5 p-2 text-xs text-zinc-200">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HouseBadge house={item.house} />
                <span className="font-medium">{item.username}</span>
              </div>
              <span className="text-zinc-400">{item.age}</span>
            </div>
            <p className="text-zinc-300">
              Bet {item.side} - {item.amount} pts
            </p>
            <Link href="/home" className="text-zinc-400 underline-offset-4 hover:underline">
              {item.marketTitle}
            </Link>
          </li>
        ))}

        {items.length === 0 ? <li className="text-xs text-zinc-400">No recent activity yet.</li> : null}
      </ul>
    </section>
  );
}
