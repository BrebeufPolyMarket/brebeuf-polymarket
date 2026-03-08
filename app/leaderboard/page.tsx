"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Crown, Trophy } from "lucide-react";
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

type BoardView = "houses" | "users";

function platformHeight(rank: number) {
  if (rank === 1) return "h-44 md:h-52";
  if (rank === 2) return "h-36 md:h-44";
  return "h-28 md:h-36";
}

function LiquidSwitch({ view }: { view: BoardView }) {
  return (
    <div className="relative mt-6 w-full rounded-[22px] border border-[#cfdae7] bg-[rgba(255,255,255,0.62)] p-1.5 backdrop-blur-xl shadow-[0_18px_36px_-26px_rgba(26,22,21,0.45)]">
      <span
        className="pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-2xl border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(226,236,245,0.88)_100%)] shadow-[0_10px_24px_-18px_rgba(21,108,194,0.9)]"
        style={{
          transform: view === "users" ? "translateX(100%)" : "translateX(0)",
          transition: "transform 460ms cubic-bezier(0.2, 0.9, 0.2, 1)",
        }}
      />

      <div className="relative grid grid-cols-2">
        <Link
          href="/leaderboard?view=houses"
          className={`flex h-14 items-center justify-center rounded-2xl text-base font-black tracking-[0.08em] transition ${
            view === "houses" ? "text-[var(--accent-blue)]" : "text-[var(--ink-soft)]"
          }`}
        >
          HOUSES
        </Link>
        <Link
          href="/leaderboard?view=users"
          className={`flex h-14 items-center justify-center rounded-2xl text-base font-black tracking-[0.08em] transition ${
            view === "users" ? "text-[var(--accent-blue)]" : "text-[var(--ink-soft)]"
          }`}
        >
          USERS
        </Link>
      </div>
    </div>
  );
}

function UserPodium({ rows }: { rows: LeaderboardRowData[] }) {
  const byRank = new Map(rows.map((row) => [row.rank, row]));
  const order = [2, 1, 3];

  return (
    <section className="mt-7 grid items-end gap-3 md:grid-cols-3">
      {order.map((rank, index) => {
        const row = byRank.get(rank) ?? null;

        return (
          <Reveal key={rank} className="flex h-full flex-col items-center" delay={0.62 + index * 0.08} variant="spring">
            {row ? (
              <article className="surface-soft mb-2 w-full p-3 text-center">
                <div className="mb-2 flex justify-center">
                  <UserAvatar username={row.username} house={row.house} avatarUrl={row.avatarUrl} size={48} />
                </div>
                <Link href={`/profile/view?u=${encodeURIComponent(row.username)}`} className="text-sm font-bold text-[var(--ink)] hover:underline">
                  @{row.username}
                </Link>
                <div className="mt-1 flex justify-center">
                  <HouseBadge house={row.house} />
                </div>
                <p className="mt-2 text-xs muted">{row.pointsBalance.toLocaleString()} pts</p>
              </article>
            ) : (
              <article className="surface-soft mb-2 w-full p-3 text-center text-sm muted">No rank data</article>
            )}

            <div
              className={`relative flex w-full items-center justify-center rounded-t-2xl border border-[var(--surface-stroke)] bg-[linear-gradient(180deg,#eaf2fb_0%,#dbe8f6_100%)] ${platformHeight(rank)}`}
            >
              <span className="absolute top-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-soft)]">
                {rank === 1 ? <Crown className="h-3.5 w-3.5 text-[var(--accent-gold)]" /> : null}
                {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
              </span>
              <span className="text-4xl font-black tabular-nums text-[var(--accent-blue)]">#{rank}</span>
            </div>
          </Reveal>
        );
      })}
    </section>
  );
}

function HousePodium({ houses }: { houses: HouseStandingData[] }) {
  const byRank = new Map(houses.map((house) => [house.rank, house]));
  const order = [2, 1, 3];

  return (
    <section className="mt-7 grid items-end gap-3 md:grid-cols-3">
      {order.map((rank, index) => {
        const standing = byRank.get(rank) ?? null;

        return (
          <Reveal key={rank} className="flex h-full flex-col items-center" delay={0.62 + index * 0.08} variant="spring">
            {standing ? (
              <article className="surface-soft mb-2 w-full p-3 text-center">
                <div className="mb-2 flex justify-center">
                  <HouseLogo house={standing.house} size={40} />
                </div>
                <p className="text-sm font-black" style={{ color: HOUSE_CONFIG[standing.house].colourHex }}>
                  {HOUSE_CONFIG[standing.house].displayName}
                </p>
                <p className="mt-2 text-xs muted">{standing.totalPoints.toLocaleString()} pts</p>
              </article>
            ) : (
              <article className="surface-soft mb-2 w-full p-3 text-center text-sm muted">No rank data</article>
            )}

            <div
              className={`relative flex w-full items-center justify-center rounded-t-2xl border border-[var(--surface-stroke)] bg-[linear-gradient(180deg,#f4e6da_0%,#ead9cc_100%)] ${platformHeight(rank)}`}
            >
              <span className="absolute top-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--ink-soft)]">
                {rank === 1 ? <Trophy className="h-3.5 w-3.5 text-[var(--accent-gold)]" /> : null}
                {rank === 1 ? "1st" : rank === 2 ? "2nd" : "3rd"}
              </span>
              <span className="text-4xl font-black tabular-nums text-[var(--accent-gold)]">#{rank}</span>
            </div>
          </Reveal>
        );
      })}
    </section>
  );
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<LeaderboardState | null>(null);

  const view = useMemo<BoardView>(() => (searchParams.get("view") === "users" ? "users" : "houses"), [searchParams]);

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
  const userRest = rows.filter((row) => row.rank > 3);
  const houseRest = sortedHouseStandings.filter((house) => house.rank > 3);

  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto w-full max-w-6xl">
        <Reveal delay={0.5} variant="spring">
          <h1 className="inline-flex items-center gap-3 text-3xl font-black text-[var(--ink)]">
            <SchoolLogo size={24} />
            Leaderboard
          </h1>
        </Reveal>
        <Reveal className="mt-2" delay={0.62} variant="spring">
          <p className="text-sm muted">Kahoot-style podium for top 3, then full rankings below.</p>
        </Reveal>

        <Reveal delay={0.66} variant="spring">
          <LiquidSwitch view={view} />
        </Reveal>

        {view === "users" ? (
          <>
            <UserPodium rows={rows} />

            <Reveal className="surface table-surface mt-7 overflow-x-auto" delay={0.78} variant="spring">
              <div className="border-b border-[var(--surface-stroke)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--ink)]">Rest of Rankings</p>
              </div>
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
                  {userRest.map((row) => (
                    <tr key={row.userId}>
                      <td className="px-4 py-3 font-semibold text-[var(--ink)]">#{row.rank}</td>
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
                  {userRest.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm muted" colSpan={6}>No users below top 3 yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Reveal>
          </>
        ) : (
          <>
            <HousePodium houses={sortedHouseStandings} />

            <Reveal className="surface table-surface mt-7 overflow-x-auto" delay={0.78} variant="spring">
              <div className="border-b border-[var(--surface-stroke)] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--ink)]">Rest of House Standings</p>
              </div>
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">House</th>
                    <th className="px-4 py-3">Total Points</th>
                    <th className="px-4 py-3">Members</th>
                    <th className="px-4 py-3">Top Contributor</th>
                  </tr>
                </thead>
                <tbody>
                  {houseRest.map((houseStanding) => (
                    <tr key={houseStanding.house}>
                      <td className="px-4 py-3 font-semibold text-[var(--ink)]">#{houseStanding.rank}</td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-2">
                          <HouseLogo house={houseStanding.house} size={18} />
                          <span className="font-semibold" style={{ color: HOUSE_CONFIG[houseStanding.house].colourHex }}>
                            {HOUSE_CONFIG[houseStanding.house].displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums ink-soft">{houseStanding.totalPoints.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums ink-soft">{houseStanding.memberCount.toLocaleString()}</td>
                      <td className="px-4 py-3 ink-soft">@{houseStanding.topContributor}</td>
                    </tr>
                  ))}
                  {houseRest.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-center text-sm muted" colSpan={5}>No houses below top 3 yet.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </Reveal>
          </>
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
