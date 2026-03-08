"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { HouseLogo } from "@/components/branding/house-logo";
import { SchoolLogo } from "@/components/branding/school-logo";
import { HouseBadge } from "@/components/house-badge";
import { LoadingState } from "@/components/loading-state";
import { Reveal } from "@/components/motion/reveal";
import { UserAvatar } from "@/components/user-avatar";
import { HOUSE_CONFIG } from "@/lib/houses";
import { getLeaderboardData } from "@/lib/data/browser-live";
import type { HouseStandingData, LeaderboardRowData, ViewerProfile } from "@/lib/data/types";

type LeaderboardState = {
  viewer: ViewerProfile | null;
  rows: LeaderboardRowData[];
  houses: HouseStandingData[];
};

function podiumTone(rank: number) {
  if (rank === 1) return "border-[var(--accent-gold)]/55";
  if (rank === 2) return "border-slate-300";
  return "border-amber-600/30";
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LeaderboardState | null>(null);

  const view = useMemo(() => (searchParams.get("view") === "users" ? "users" : "houses"), [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const data = await getLeaderboardData();
      if (cancelled) return;
      setState(data);

      if (!data.viewer) {
        router.push("/auth/login");
        return;
      }
      if (!data.viewer.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }
      if (data.viewer.status === "banned") {
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
      <AuthenticatedShell viewer={null}>
        <LoadingState title="Loading Leaderboard..." />
      </AuthenticatedShell>
    );
  }

  const { viewer, rows, houses } = state;
  const sortedHouseStandings = [...houses].sort((a, b) => a.rank - b.rank);
  const podium = rows.slice(0, 3);

  return (
    <AuthenticatedShell viewer={viewer}>
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

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/leaderboard?view=houses"
            className={view === "houses" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}
          >
            Houses
          </Link>
          <Link
            href="/leaderboard?view=users"
            className={view === "users" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}
          >
            Users
          </Link>
        </div>

        {view === "users" ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              {podium.map((row, index) => (
                <Reveal key={row.userId} className={`surface p-4 ${podiumTone(row.rank)}`} delay={0.68 + index * 0.1} variant="spring">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="inline-flex items-center gap-1 text-sm font-bold text-[var(--ink)]">
                      <Medal className="h-4 w-4" />
                      #{row.rank}
                    </p>
                    {row.rank === 1 ? <Crown className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                  </div>
                  <div className="flex items-center gap-3">
                    <UserAvatar username={row.username} house={row.house} avatarUrl={row.avatarUrl} size={36} />
                    <div>
                      <Link href={`/profile/view?u=${encodeURIComponent(row.username)}`} className="font-semibold text-[var(--ink)] hover:underline">
                        @{row.username}
                      </Link>
                      <div className="mt-1">
                        <HouseBadge house={row.house} />
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs muted">Balance: {row.pointsBalance.toLocaleString()} pts</p>
                </Reveal>
              ))}
            </section>

            <Reveal className="surface table-surface mt-6 overflow-x-auto" delay={0.78} variant="spring">
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
                    <tr key={row.userId}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                          {row.rank <= 3 ? <Crown className="h-4 w-4 text-[var(--accent-gold)]" /> : null}
                          <span>#{row.rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/profile/view?u=${encodeURIComponent(row.username)}`} className="flex items-center gap-2 hover:underline">
                          <UserAvatar username={row.username} house={row.house} avatarUrl={row.avatarUrl} size={24} />
                          <HouseBadge house={row.house} />
                          <span className="font-medium text-[var(--ink)]">@{row.username}</span>
                        </Link>
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
          </>
        ) : (
          <section id="house-cup" className="mt-8">
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
                    <p className="mt-2 text-xs muted">Top contributor: @{houseStanding.topContributor}</p>
                  </Reveal>
                );
              })}
            </div>
          </section>
        )}
      </section>
    </AuthenticatedShell>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense
      fallback={(
        <AuthenticatedShell viewer={null}>
          <LoadingState title="Loading Leaderboard..." />
        </AuthenticatedShell>
      )}
    >
      <LeaderboardContent />
    </Suspense>
  );
}
