"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Trophy } from "lucide-react";

import { HouseLogo } from "@/components/branding/house-logo";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HouseBadge } from "@/components/house-badge";
import { Reveal } from "@/components/motion/reveal";
import { HOUSE_CONFIG } from "@/lib/houses";
import { getLeaderboardData } from "@/lib/data/browser-live";
import type { HouseStandingData, LeaderboardRowData, ViewerProfile } from "@/lib/data/types";

type LeaderboardState = {
  viewer: ViewerProfile | null;
  rows: LeaderboardRowData[];
  houses: HouseStandingData[];
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [state, setState] = useState<LeaderboardState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getLeaderboardData();
      if (cancelled) return;
      setState(data);

      if (!data.viewer) {
        router.push("/auth/login");
      } else if (data.viewer.status === "banned") {
        router.push("/banned");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!state) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-md p-6 text-center">
          <h1 className="text-xl font-black text-[var(--ink)]">Loading Leaderboard...</h1>
        </article>
      </main>
    );
  }

  const { viewer, rows, houses } = state;
  const sortedHouseStandings = [...houses].sort((a, b) => a.rank - b.rank);

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-6xl">
        <Reveal delay={0.5} variant="spring">
          <h1 className="inline-flex items-center gap-3 text-3xl font-black text-[var(--ink)]">
            <SchoolLogo size={24} />
            Leaderboard
          </h1>
        </Reveal>
        <Reveal className="mt-2" delay={0.62} variant="spring">
          <p className="text-sm muted">Track top forecasters and the House Cup race in real time.</p>
        </Reveal>

        <Reveal className="surface table-surface mt-6 overflow-x-auto" delay={0.75} variant="spring">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase muted">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Lifetime Won</th>
                <th className="px-4 py-3">Win Rate</th>
                <th className="px-4 py-3">Biggest Win</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.username}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                      {row.rank <= 3 ? <Crown className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                      <span>#{row.rank}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <HouseBadge house={row.house} />
                      <span className="font-medium text-[var(--ink)]">{row.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.pointsBalance.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.lifetimeWon.toLocaleString()}</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.winRate}%</td>
                  <td className="px-4 py-3 tabular-nums ink-soft">{row.biggestWin.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        {viewer ? (
          <Reveal className="mt-3" delay={0.85} variant="spring">
            <p className="text-xs muted">
              Your current balance: {viewer.pointsBalance.toLocaleString()} pts | Lifetime won: {viewer.lifetimeWon.toLocaleString()} pts
            </p>
          </Reveal>
        ) : null}

        <section id="house-cup" className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[var(--accent-gold)]" />
            <h2 className="text-2xl font-bold text-[var(--ink)]">House Cup Standings</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedHouseStandings.map((houseStanding, index) => {
              const house = HOUSE_CONFIG[houseStanding.house];
              const isLeader = houseStanding.rank === 1;

              return (
                <Reveal
                  key={houseStanding.house}
                  as="article"
                  className={`surface p-4 ${isLeader ? "ring-2 ring-[var(--accent-gold)]/40" : ""}`}
                  delay={0.62 + index * 0.1}
                  variant="spring"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-lg font-bold" style={{ color: house.colourHex }}>
                      <HouseLogo house={houseStanding.house} size={18} />
                      #{houseStanding.rank} {house.displayName}
                    </h3>
                    {isLeader ? <Trophy className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                  </div>
                  <p className="mt-2 text-sm ink-soft">{houseStanding.totalPoints.toLocaleString()} total points</p>
                  <p className="text-xs muted">{houseStanding.memberCount} active members</p>
                  <p className="mt-2 text-xs muted">Top contributor: {houseStanding.topContributor}</p>
                </Reveal>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
