import Link from "next/link";

import { HouseBadge } from "@/components/house-badge";
import { UserAvatar } from "@/components/user-avatar";
import type { LiveActivityItem } from "@/lib/data/types";

type LiveActivityPanelProps = {
  items: LiveActivityItem[];
};

export function LiveActivityPanel({ items }: LiveActivityPanelProps) {
  return (
    <section className="surface p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Live Activity</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="surface-soft p-2 text-xs text-[var(--ink-soft)]">
            <div className="mb-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserAvatar username={item.username} house={item.house} avatarUrl={item.avatarUrl} size={22} />
                <HouseBadge house={item.house} />
                <span className="font-medium text-[var(--ink)]">{item.username}</span>
              </div>
              <span className="muted">{item.age}</span>
            </div>
            <p className="ink-soft">
              Bet {item.side} - {item.amount} pts
            </p>
            <Link href="/home" className="muted underline-offset-4 hover:underline">
              {item.marketTitle}
            </Link>
          </li>
        ))}

        {items.length === 0 ? <li className="text-xs muted">No recent activity yet.</li> : null}
      </ul>
    </section>
  );
}
