"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { RecommendationReviewActions } from "@/components/admin/recommendation-review-actions";
import { getAdminRecommendationsData } from "@/lib/data/browser-live";
import type { AdminRecommendationsData, MarketRecommendationStatus } from "@/lib/data/types";

const FILTER_OPTIONS = ["all", "open", "under_review", "accepted", "rejected"] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

function AccessState({ message }: { message: string }) {
  return (
    <main className="app-shell grid min-h-screen place-items-center px-6">
      <article className="surface max-w-md p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">Admin Access</h1>
        <p className="mt-2 text-sm muted">{message}</p>
        <Link href="/auth/login" className="mt-4 inline-block text-sm font-semibold text-[var(--accent-blue)] hover:underline">
          Go to Sign In
        </Link>
      </article>
    </main>
  );
}

function AdminRecommendationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AdminRecommendationsData | null>(null);
  const [loading, setLoading] = useState(true);

  const selectedFilter = useMemo<FilterStatus>(() => {
    const status = searchParams.get("status") ?? "all";
    return FILTER_OPTIONS.includes(status as FilterStatus) ? (status as FilterStatus) : "all";
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getAdminRecommendationsData(selectedFilter);
      if (cancelled) return;

      setState(data);
      setLoading(false);

      if (!data) {
        router.push("/home");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router, selectedFilter]);

  if (loading) {
    return (
      <main className="app-shell grid min-h-screen place-items-center px-6">
        <article className="surface max-w-md p-6 text-center">
          <h1 className="text-2xl font-black text-[var(--ink)]">Loading Recommendations...</h1>
        </article>
      </main>
    );
  }

  if (!state) {
    return <AccessState message="Admin access required." />;
  }

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-[var(--ink)]">Market Recommendations</h1>
            <p className="mt-2 text-sm muted">Open recommendations: {state.openCount.toLocaleString()}</p>
          </div>
          <Link href="/admin" className="btn-secondary px-4 py-2 text-sm">
            Back to Admin Dashboard
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((filter) => {
            const isActive = filter === selectedFilter;
            return (
              <Link
                key={filter}
                href={filter === "all" ? "/admin/recommendations" : `/admin/recommendations?status=${filter}`}
                className={isActive ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"}
              >
                {filter === "all" ? "All" : filter.replace("_", " ")}
              </Link>
            );
          })}
        </div>

        <div className="surface table-surface overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase muted">
              <tr>
                <th className="px-4 py-3">Submitted By</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.recommendations.map((recommendation) => (
                <tr key={recommendation.id}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-[var(--ink)]">{recommendation.username || "Unknown"}</p>
                    <p className="text-xs muted">{recommendation.userEmail || "-"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-[var(--ink)]">{recommendation.title}</p>
                    <p className="mt-1 max-w-[380px] text-xs ink-soft">{recommendation.description}</p>
                    {recommendation.sourceUrl ? (
                      <a
                        className="mt-1 inline-block text-xs font-medium text-[var(--accent-blue)] hover:underline"
                        href={recommendation.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Source link
                      </a>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top ink-soft">{recommendation.category}</td>
                  <td className="px-4 py-3 align-top">
                    <span className="pill">{recommendation.status.replace("_", " ")}</span>
                  </td>
                  <td className="px-4 py-3 align-top text-xs muted">{new Date(recommendation.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3 align-top text-xs ink-soft">{recommendation.adminNotes ?? "-"}</td>
                  <td className="px-4 py-3 align-top min-w-[220px]">
                    <RecommendationReviewActions
                      recommendationId={recommendation.id}
                      initialStatus={recommendation.status as MarketRecommendationStatus}
                      initialNotes={recommendation.adminNotes}
                    />
                  </td>
                </tr>
              ))}
              {state.recommendations.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm muted" colSpan={7}>
                    No recommendations for this filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default function AdminRecommendationsPage() {
  return (
    <Suspense
      fallback={(
        <main className="app-shell grid min-h-screen place-items-center px-6">
          <article className="surface max-w-md p-6 text-center">
            <h1 className="text-2xl font-black text-[var(--ink)]">Loading Recommendations...</h1>
          </article>
        </main>
      )}
    >
      <AdminRecommendationsContent />
    </Suspense>
  );
}
