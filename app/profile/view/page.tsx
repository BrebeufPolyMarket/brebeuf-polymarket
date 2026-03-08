"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthenticatedShell } from "@/components/authenticated-shell";
import { HouseBadge } from "@/components/house-badge";
import { UserAvatar } from "@/components/user-avatar";
import { getPublicProfileData, getViewerProfile } from "@/lib/data/browser-live";
import type { PublicProfileData, ViewerProfile } from "@/lib/data/types";

function ProfileViewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usernameParam = (searchParams.get("u") ?? "").trim().toLowerCase();

  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const viewerData = await getViewerProfile();
      if (cancelled) return;

      setViewer(viewerData);

      if (!viewerData) {
        router.push("/auth/login");
        return;
      }

      if (!viewerData.profileCompletedAt) {
        router.push("/profile/setup");
        return;
      }

      if (!usernameParam) {
        setLoading(false);
        return;
      }

      const profileData = await getPublicProfileData(usernameParam);
      if (cancelled) return;

      setProfile(profileData);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, usernameParam]);

  return (
    <AuthenticatedShell viewer={viewer}>
      {loading ? (
        <section className="mx-auto max-w-5xl space-y-4">
          <div className="surface h-24" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface h-24" />
            <div className="surface h-24" />
            <div className="surface h-24" />
          </div>
          <div className="surface h-80" />
        </section>
      ) : !profile ? (
        <section className="mx-auto max-w-3xl surface p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Profile Not Available</h1>
          <p className="mt-2 text-sm muted">This profile is not available with your current account access.</p>
        </section>
      ) : (
        <section className="mx-auto max-w-5xl space-y-5">
          <article className="surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <UserAvatar username={profile.username} house={profile.house} avatarUrl={profile.avatarUrl} size={56} />
                <div>
                  <h1 className="text-2xl font-black text-[var(--ink)]">@{profile.username}</h1>
                  <div className="mt-1 flex items-center gap-2">
                    <HouseBadge house={profile.house} />
                    {profile.gradeYear ? <span className="text-xs muted">Grade {profile.gradeYear}</span> : null}
                  </div>
                </div>
              </div>
            </div>
            {profile.bio ? <p className="mt-4 text-sm ink-soft">{profile.bio}</p> : null}
            {profile.favouriteSubject ? <p className="mt-2 text-xs muted">Favourite subject: {profile.favouriteSubject}</p> : null}
          </article>

          <div className="grid gap-3 md:grid-cols-4">
            <article className="surface p-4">
              <p className="text-xs uppercase tracking-[0.13em] muted">Balance</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{profile.pointsBalance.toLocaleString()}</p>
            </article>
            <article className="surface p-4">
              <p className="text-xs uppercase tracking-[0.13em] muted">Lifetime Won</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{profile.lifetimeWon.toLocaleString()}</p>
            </article>
            <article className="surface p-4">
              <p className="text-xs uppercase tracking-[0.13em] muted">Win Rate</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{profile.winRate}%</p>
            </article>
            <article className="surface p-4">
              <p className="text-xs uppercase tracking-[0.13em] muted">Biggest Win</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-[var(--ink)]">{profile.biggestWin.toLocaleString()}</p>
            </article>
          </div>

          <article className="surface table-surface p-4">
            <h2 className="mb-3 text-lg font-semibold text-[var(--ink)]">Recent Trading Activity</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Market</th>
                    <th className="px-3 py-2">Points</th>
                    <th className="px-3 py-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.trades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="px-3 py-3 font-medium text-[var(--ink)]">{trade.type}</td>
                      <td className="px-3 py-3 ink-soft">{trade.marketTitle ?? "-"}</td>
                      <td className="px-3 py-3 tabular-nums ink-soft">{trade.pointsDelta > 0 ? `+${trade.pointsDelta}` : trade.pointsDelta}</td>
                      <td className="px-3 py-3 text-xs muted">{new Date(trade.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                  {profile.trades.length === 0 ? (
                    <tr>
                      <td className="px-3 py-6 text-center text-sm muted" colSpan={4}>
                        No recent activity.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      )}
    </AuthenticatedShell>
  );
}

export default function PublicProfilePage() {
  return (
    <Suspense
      fallback={(
        <AuthenticatedShell viewer={null}>
          <section className="mx-auto max-w-5xl space-y-4">
            <div className="surface h-24" />
            <div className="surface h-72" />
          </section>
        </AuthenticatedShell>
      )}
    >
      <ProfileViewContent />
    </Suspense>
  );
}
