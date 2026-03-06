import Link from "next/link";

import { RecommendationReviewActions } from "@/components/admin/recommendation-review-actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FILTER_OPTIONS = ["all", "open", "under_review", "accepted", "rejected"] as const;
type FilterStatus = (typeof FILTER_OPTIONS)[number];

type PageProps = {
  searchParams?: Promise<{ status?: string }>;
};

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

export default async function AdminRecommendationsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedFilter = FILTER_OPTIONS.includes((resolvedSearchParams.status ?? "") as FilterStatus)
    ? (resolvedSearchParams.status as FilterStatus)
    : "all";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AccessState message="Sign in is required." />;
  }

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_admin) {
    return <AccessState message="Admin access required." />;
  }

  let recommendationsQuery = supabase
    .from("market_recommendations")
    .select("id, title, description, category, source_url, status, admin_notes, created_at, reviewed_at, users!market_recommendations_user_id_fkey(username, email)")
    .order("created_at", { ascending: false })
    .limit(300);

  if (selectedFilter !== "all") {
    recommendationsQuery = recommendationsQuery.eq("status", selectedFilter);
  }

  const { data: recommendations } = await recommendationsQuery;

  const { count: openCount } = await supabase
    .from("market_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <main className="app-shell px-6 py-10 md:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-[var(--ink)]">Market Recommendations</h1>
            <p className="mt-2 text-sm muted">Open recommendations: {openCount ?? 0}</p>
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
              {(recommendations ?? []).map((recommendation) => {
                const submitter = Array.isArray(recommendation.users) ? recommendation.users[0] : recommendation.users;

                return (
                  <tr key={recommendation.id}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-[var(--ink)]">{submitter?.username ?? "Unknown"}</p>
                      <p className="text-xs muted">{submitter?.email ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <p className="font-medium text-[var(--ink)]">{recommendation.title}</p>
                      <p className="mt-1 max-w-[380px] text-xs ink-soft">{recommendation.description}</p>
                      {recommendation.source_url ? (
                        <a
                          className="mt-1 inline-block text-xs font-medium text-[var(--accent-blue)] hover:underline"
                          href={recommendation.source_url}
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
                    <td className="px-4 py-3 align-top text-xs muted">{new Date(recommendation.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 align-top text-xs ink-soft">{recommendation.admin_notes ?? "-"}</td>
                    <td className="px-4 py-3 align-top min-w-[220px]">
                      <RecommendationReviewActions
                        recommendationId={recommendation.id}
                        initialStatus={recommendation.status}
                        initialNotes={recommendation.admin_notes}
                      />
                    </td>
                  </tr>
                );
              })}
              {(recommendations ?? []).length === 0 ? (
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
