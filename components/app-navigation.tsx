import Link from "next/link";
import { BarChart3, Home, LayoutList, Shield, Trophy, User } from "lucide-react";

import { HouseBadge } from "@/components/house-badge";
import type { ViewerProfile } from "@/lib/data/types";

type AppNavigationProps = {
  viewer: ViewerProfile | null;
};

export function AppNavigation({ viewer }: AppNavigationProps) {
  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { href: "/watchlist", label: "Watchlist", icon: LayoutList },
    { href: "/profile/setup", label: "Profile", icon: User },
    ...(viewer?.isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <>
      <aside className="surface hidden min-h-[calc(100vh-2rem)] w-64 shrink-0 p-4 lg:block">
        <Link href="/home" className="mb-6 block text-xs font-bold tracking-[0.2em] text-[var(--accent-blue)]">
          BREBEUF POLYMARKET
        </Link>

        {viewer ? (
          <div className="surface-soft mb-5 p-3">
            <p className="text-xs muted">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">{viewer.username}</p>
            <div className="mt-2">
              <HouseBadge house={viewer.house} />
            </div>
            <p className="mt-2 text-xs ink-soft">Balance: {viewer.pointsBalance.toLocaleString()} pts</p>
          </div>
        ) : null}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--ink-soft)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--ink)]"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--surface-stroke)] p-2 backdrop-blur lg:hidden"
        style={{ background: "rgba(255, 255, 255, 0.9)" }}
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex min-h-11 flex-col items-center justify-center rounded-lg text-[10px] text-[var(--ink-soft)] hover:bg-[var(--surface-soft)]"
                >
                  <Icon className="mb-0.5 h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
