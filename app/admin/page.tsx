"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, PlusCircle, Search, ShieldAlert, Users } from "lucide-react";

import { RecommendationReviewActions } from "@/components/admin/recommendation-review-actions";
import { AuthenticatedShell } from "@/components/authenticated-shell";
import { HouseBadge } from "@/components/house-badge";
import { LoadingState } from "@/components/loading-state";
import { UserAvatar } from "@/components/user-avatar";
import { getAdminDashboardData, getAdminRecommendationsData, getAdminUsersData, getPendingApprovalsData, getViewerProfile } from "@/lib/data/browser-live";
import type { AdminDashboardData, AdminRecommendationsData, AdminUserRow, PendingApprovalRow, ViewerProfile } from "@/lib/data/types";
import { HOUSE_IDS, type HouseId } from "@/lib/houses";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminTab = "markets" | "approvals" | "users" | "recommendations";
type RecommendationFilter = "all" | "open" | "under_review" | "accepted" | "rejected";

type AdminState = {
  viewer: ViewerProfile | null;
  dashboard: AdminDashboardData | null;
  approvals: PendingApprovalRow[];
  users: AdminUserRow[];
  recommendations: AdminRecommendationsData | null;
};

const RECOMMENDATION_FILTERS: RecommendationFilter[] = ["all", "open", "under_review", "accepted", "rejected"];

function getTab(value: string | null): AdminTab {
  if (value === "approvals" || value === "users" || value === "recommendations") {
    return value;
  }
  return "markets";
}

function AccessDenied({ viewer }: { viewer: ViewerProfile | null }) {
  return (
    <AuthenticatedShell viewer={viewer}>
      <section className="mx-auto max-w-2xl surface p-6 text-center">
        <h1 className="text-2xl font-black text-[var(--ink)]">Admin Access Required</h1>
        <p className="mt-2 text-sm muted">This workspace is visible only to approved admin accounts.</p>
        <Link href="/home" className="btn-secondary mt-4 inline-block px-4 py-2 text-sm">
          Back to Home
        </Link>
      </section>
    </AuthenticatedShell>
  );
}

function AdminDashboardContent() {
  const searchParams = useSearchParams();
  const tab = getTab(searchParams.get("tab"));

  const [recommendationFilter, setRecommendationFilter] = useState<RecommendationFilter>("all");
  const [state, setState] = useState<AdminState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [approvalHouseByUser, setApprovalHouseByUser] = useState<Record<string, HouseId>>({});
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [rejectUserId, setRejectUserId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [userQuery, setUserQuery] = useState("");
  const [focusedUserId, setFocusedUserId] = useState<string | null>(null);
  const [focusedUserHouse, setFocusedUserHouse] = useState<HouseId>("lalemant");
  const [focusedUserPoints, setFocusedUserPoints] = useState("25");
  const [focusedUserReason, setFocusedUserReason] = useState("Manual adjustment by admin");

  const [marketMakerOpen, setMarketMakerOpen] = useState(false);
  const [marketTitle, setMarketTitle] = useState("");
  const [marketDescription, setMarketDescription] = useState("");
  const [marketCategory, setMarketCategory] = useState("Sports");
  const [marketType, setMarketType] = useState<"binary" | "multi">("binary");
  const [marketCloseTime, setMarketCloseTime] = useState("");
  const [marketCriteria, setMarketCriteria] = useState("");
  const [marketLiquidity, setMarketLiquidity] = useState("100");
  const [marketFeatured, setMarketFeatured] = useState(false);
  const [marketOptionsRaw, setMarketOptionsRaw] = useState("Option A\nOption B");

  async function loadWorkspace() {
    setLoading(true);

    const viewer = await getViewerProfile();
    if (!viewer) {
      setState({
        viewer: null,
        dashboard: null,
        approvals: [],
        users: [],
        recommendations: null,
      });
      setLoading(false);
      return;
    }

    const [dashboard, approvals, users, recommendations] = await Promise.all([
      getAdminDashboardData(),
      tab === "approvals" ? getPendingApprovalsData() : Promise.resolve([] as PendingApprovalRow[]),
      tab === "users" ? getAdminUsersData() : Promise.resolve([] as AdminUserRow[]),
      tab === "recommendations" ? getAdminRecommendationsData(recommendationFilter) : Promise.resolve(null as AdminRecommendationsData | null),
    ]);

    setState({
      viewer,
      dashboard,
      approvals: approvals ?? [],
      users: users ?? [],
      recommendations,
    });
    setLoading(false);
  }

  useEffect(() => {
    void loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, recommendationFilter]);

  useEffect(() => {
    if (!state?.approvals.length) return;

    setApprovalHouseByUser((current) => {
      const next = { ...current };
      for (const row of state.approvals) {
        if (!next[row.id]) {
          next[row.id] = row.house;
        }
      }
      return next;
    });
  }, [state?.approvals]);

  const usersFiltered = useMemo(() => {
    if (!state?.users.length) return [] as AdminUserRow[];
    const query = userQuery.trim().toLowerCase();
    if (!query) return state.users;
    return state.users.filter((user) => {
      return user.username.toLowerCase().includes(query)
        || user.email.toLowerCase().includes(query)
        || user.fullName.toLowerCase().includes(query);
    });
  }, [state?.users, userQuery]);

  const focusedUser = useMemo(() => {
    if (!focusedUserId || !state?.users.length) return null;
    return state.users.find((user) => user.id === focusedUserId) ?? null;
  }, [focusedUserId, state?.users]);

  useEffect(() => {
    if (!focusedUser) return;
    setFocusedUserHouse(focusedUser.house);
  }, [focusedUser]);

  async function callAdminRpc(name: string, args: Record<string, unknown>, busyId: string, successMessage: string) {
    setActionError(null);
    setActionMessage(null);
    setBusyKey(busyId);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.rpc(name, args);

    setBusyKey(null);

    if (error) {
      setActionError(error.message || "Admin action failed.");
      return;
    }

    setActionMessage(successMessage);
    await loadWorkspace();
  }

  async function approveUser(userId: string) {
    if (!state?.viewer) return;
    await callAdminRpc(
      "approve_user",
      {
        p_user_id: userId,
        p_admin_id: state.viewer.id,
        p_house_override: approvalHouseByUser[userId] ?? null,
      },
      `approve-${userId}`,
      "User approved.",
    );
    setSelectedApprovalIds((current) => current.filter((id) => id !== userId));
  }

  async function approveSelected() {
    if (!state?.viewer) return;

    const ids = selectedApprovalIds.slice();
    if (ids.length === 0) {
      setActionError("Select at least one pending user.");
      return;
    }

    setBusyKey("approve-bulk");
    setActionError(null);
    setActionMessage(null);

    const supabase = createSupabaseBrowserClient();
    const failures: string[] = [];

    for (const userId of ids) {
      const { error } = await supabase.rpc("approve_user", {
        p_user_id: userId,
        p_admin_id: state.viewer.id,
        p_house_override: approvalHouseByUser[userId] ?? null,
      });

      if (error) {
        failures.push(userId);
      }
    }

    setBusyKey(null);

    if (failures.length > 0) {
      setActionError(`Failed to approve ${failures.length} account(s).`);
    } else {
      setActionMessage(`Approved ${ids.length} account(s).`);
    }

    setSelectedApprovalIds([]);
    await loadWorkspace();
  }

  async function rejectUser() {
    if (!state?.viewer || !rejectUserId) return;
    if (rejectReason.trim().length < 6) {
      setActionError("Reject reason must be at least 6 characters.");
      return;
    }

    await callAdminRpc(
      "reject_user",
      {
        p_user_id: rejectUserId,
        p_admin_id: state.viewer.id,
        p_reason: rejectReason.trim(),
      },
      `reject-${rejectUserId}`,
      "User rejected.",
    );

    setRejectUserId(null);
    setRejectReason("");
  }

  async function saveFocusedUserHouse() {
    if (!state?.viewer || !focusedUser) return;
    await callAdminRpc(
      "admin_override_house",
      {
        p_user_id: focusedUser.id,
        p_new_house: focusedUserHouse,
        p_admin_id: state.viewer.id,
        p_notes: "Updated from admin users tab",
      },
      `house-${focusedUser.id}`,
      "House updated.",
    );
  }

  async function adjustFocusedUserPoints() {
    if (!state?.viewer || !focusedUser) return;
    const points = Number(focusedUserPoints);
    if (!Number.isInteger(points) || points <= 0) {
      setActionError("Points must be a positive integer.");
      return;
    }

    await callAdminRpc(
      "admin_add_points",
      {
        p_user_id: focusedUser.id,
        p_points: points,
        p_reason: focusedUserReason.trim() || "Manual adjustment by admin",
        p_admin_id: state.viewer.id,
      },
      `points-${focusedUser.id}`,
      "Points added.",
    );
  }

  async function setFocusedUserBanned(nextBanned: boolean) {
    if (!state?.viewer || !focusedUser) return;
    if (focusedUserReason.trim().length < 4) {
      setActionError("Provide a clear moderation reason.");
      return;
    }

    await callAdminRpc(
      "admin_set_user_ban",
      {
        p_user_id: focusedUser.id,
        p_banned: nextBanned,
        p_reason: focusedUserReason.trim(),
        p_admin_id: state.viewer.id,
      },
      `ban-${focusedUser.id}`,
      nextBanned ? "User banned." : "User unbanned.",
    );
  }

  async function createMarket() {
    if (!state?.viewer) return;

    if (marketTitle.trim().length < 8) {
      setActionError("Market title must be at least 8 characters.");
      return;
    }
    if (marketDescription.trim().length < 20) {
      setActionError("Description must be at least 20 characters.");
      return;
    }
    if (marketCriteria.trim().length < 100) {
      setActionError("Resolution criteria must be at least 100 characters.");
      return;
    }
    if (!marketCloseTime) {
      setActionError("Set a close date and time.");
      return;
    }

    const closeIso = new Date(marketCloseTime).toISOString();
    const options = marketType === "multi"
      ? marketOptionsRaw
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : null;

    await callAdminRpc(
      "admin_create_market",
      {
        p_title: marketTitle.trim(),
        p_description: marketDescription.trim(),
        p_category: marketCategory,
        p_type: marketType,
        p_close_time: closeIso,
        p_resolution_criteria: marketCriteria.trim(),
        p_liquidity_param: Number(marketLiquidity) || 100,
        p_is_featured: marketFeatured,
        p_options: options,
        p_admin_id: state.viewer.id,
      },
      "market-create",
      `${marketType === "binary" ? "Binary" : "Multi"} market created.`,
    );

    setMarketMakerOpen(false);
    setMarketTitle("");
    setMarketDescription("");
    setMarketCategory("Sports");
    setMarketType("binary");
    setMarketCloseTime("");
    setMarketCriteria("");
    setMarketLiquidity("100");
    setMarketFeatured(false);
    setMarketOptionsRaw("Option A\nOption B");
  }

  if (loading || !state) {
    return (
      <AuthenticatedShell viewer={null}>
        <LoadingState title="Loading Admin Workspace..." />
      </AuthenticatedShell>
    );
  }

  if (!state.viewer) {
    return <AccessDenied viewer={null} />;
  }

  if (!state.dashboard || !state.viewer.isAdmin) {
    return <AccessDenied viewer={state.viewer} />;
  }

  const dashboard = state.dashboard;

  return (
    <AuthenticatedShell viewer={state.viewer}>
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-[var(--ink)]">Admin Workspace</h1>
              <p className="mt-1 text-sm muted">Moderate users, approve accounts, review recommendations, and manage market lifecycle.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="surface-soft px-3 py-2">
                <p className="muted">Pending</p>
                <p className="text-sm font-bold text-[var(--ink)]">{dashboard.pendingApprovals}</p>
              </div>
              <div className="surface-soft px-3 py-2">
                <p className="muted">Open Recos</p>
                <p className="text-sm font-bold text-[var(--ink)]">{dashboard.openRecommendations}</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin?tab=markets" className={tab === "markets" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Markets</Link>
            <Link href="/admin?tab=approvals" className={tab === "approvals" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Approvals</Link>
            <Link href="/admin?tab=users" className={tab === "users" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Users</Link>
            <Link href="/admin?tab=recommendations" className={tab === "recommendations" ? "btn-primary px-4 py-2 text-xs" : "btn-secondary px-4 py-2 text-xs"}>Recommendations</Link>
          </nav>
        </header>

        {actionError ? (
          <p className="surface border-[var(--accent-red)]/30 bg-[color-mix(in_srgb,#fff_82%,#f8e3dd_18%)] p-3 text-sm font-medium text-[var(--accent-red)]">
            {actionError}
          </p>
        ) : null}
        {actionMessage ? (
          <p className="surface border-[var(--accent-green)]/30 bg-[color-mix(in_srgb,#fff_82%,#e4f6ec_18%)] p-3 text-sm font-medium text-[var(--accent-green)]">
            {actionMessage}
          </p>
        ) : null}

        {tab === "markets" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[var(--ink)]">Market Lifecycle</h2>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
                onClick={() => setMarketMakerOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Market Maker
              </button>
            </div>

            <div className="surface table-surface overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-4 py-3">Market</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Close</th>
                    <th className="px-4 py-3">Volume</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.markets.map((market) => (
                    <tr key={market.id}>
                      <td className="px-4 py-3 font-medium text-[var(--ink)]">{market.title}</td>
                      <td className="px-4 py-3">
                        <span className="pill">{market.marketType.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 ink-soft">{market.status}</td>
                      <td className="px-4 py-3 text-xs ink-soft">{new Date(market.closeTime).toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums ink-soft">{market.totalVolume.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/markets/resolve?id=${market.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                          Resolve / Cancel
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {dashboard.markets.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm muted" colSpan={6}>No markets available.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "approvals" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[var(--ink)]">Pending Approvals</h2>
              <button
                type="button"
                className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
                disabled={busyKey === "approve-bulk"}
                onClick={() => {
                  void approveSelected();
                }}
              >
                <Check className="h-4 w-4" />
                {busyKey === "approve-bulk" ? "Approving..." : `Approve Selected (${selectedApprovalIds.length})`}
              </button>
            </div>

            <div className="surface table-surface overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-4 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">House</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.approvals.map((row) => {
                    const checked = selectedApprovalIds.includes(row.id);
                    const busy = busyKey === `approve-${row.id}` || busyKey === `reject-${row.id}`;

                    return (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              const isChecked = event.target.checked;
                              setSelectedApprovalIds((current) => {
                                if (isChecked) return [...current, row.id];
                                return current.filter((id) => id !== row.id);
                              });
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-[var(--ink)]">{row.username || "(pending username)"}</p>
                          <p className="text-xs muted">{row.email}</p>
                          {row.fullName ? <p className="mt-1 text-xs ink-soft">{row.fullName}</p> : null}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <select
                            value={approvalHouseByUser[row.id] ?? row.house}
                            className="input-clean max-w-[150px] text-xs"
                            onChange={(event) => {
                              const nextHouse = event.target.value as HouseId;
                              setApprovalHouseByUser((current) => ({ ...current, [row.id]: nextHouse }));
                            }}
                          >
                            {HOUSE_IDS.map((id) => (
                              <option key={id} value={id}>{id}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 align-top ink-soft">{row.gradeYear ? `Grade ${row.gradeYear}` : "-"}</td>
                        <td className="px-4 py-3 align-top text-xs muted">{new Date(row.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-60"
                              disabled={busy}
                              onClick={() => {
                                void approveUser(row.id);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border border-[var(--accent-red)]/35 bg-[color-mix(in_srgb,#fff_82%,#f8e3dd_18%)] px-3 py-1.5 text-xs font-semibold text-[var(--accent-red)]"
                              disabled={busy}
                              onClick={() => {
                                setRejectUserId(row.id);
                                setRejectReason("");
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {state.approvals.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm muted" colSpan={6}>No pending approvals.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "users" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[var(--ink)]">User Management</h2>
              <label className="relative block w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--ink-muted)]" />
                <input
                  value={userQuery}
                  onChange={(event) => setUserQuery(event.target.value)}
                  placeholder="Search username, email, or full name"
                  className="input-clean pl-9"
                />
              </label>
            </div>

            <div className="surface table-surface overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">House</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Balance</th>
                    <th className="px-4 py-3">Lifetime Won</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersFiltered.map((user) => (
                    <tr key={user.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar username={user.username} house={user.house} avatarUrl={user.avatarUrl} size={28} />
                          <div>
                            <p className="font-medium text-[var(--ink)]">@{user.username}</p>
                            <p className="text-xs muted">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><HouseBadge house={user.house} /></td>
                      <td className="px-4 py-3">
                        <span className="pill">{user.status}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums ink-soft">{user.pointsBalance.toLocaleString()}</td>
                      <td className="px-4 py-3 tabular-nums ink-soft">{user.lifetimeWon.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="btn-secondary px-3 py-1.5 text-xs"
                          onClick={() => {
                            setFocusedUserId(user.id);
                            setFocusedUserReason("Manual adjustment by admin");
                            setFocusedUserPoints("25");
                          }}
                        >
                          View / Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                  {usersFiltered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm muted" colSpan={6}>No users match this filter.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {tab === "recommendations" ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-[var(--ink)]">Recommendations Queue</h2>
              <div className="flex flex-wrap gap-2">
                {RECOMMENDATION_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={filter === recommendationFilter ? "btn-primary px-3 py-1.5 text-xs" : "btn-secondary px-3 py-1.5 text-xs"}
                    onClick={() => setRecommendationFilter(filter)}
                  >
                    {filter.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="surface table-surface overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase muted">
                  <tr>
                    <th className="px-4 py-3">Submitted By</th>
                    <th className="px-4 py-3">Idea</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.recommendations?.recommendations ?? []).map((rec) => (
                    <tr key={rec.id}>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-[var(--ink)]">{rec.username}</p>
                        <p className="text-xs muted">{rec.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="font-medium text-[var(--ink)]">{rec.title}</p>
                        <p className="mt-1 text-xs ink-soft">{rec.description}</p>
                        <p className="mt-1 text-[11px] muted">{rec.category}</p>
                      </td>
                      <td className="px-4 py-3 align-top"><span className="pill">{rec.status.replace("_", " ")}</span></td>
                      <td className="px-4 py-3 align-top min-w-[220px]">
                        <RecommendationReviewActions
                          recommendationId={rec.id}
                          initialStatus={rec.status}
                          initialNotes={rec.adminNotes}
                        />
                      </td>
                    </tr>
                  ))}
                  {(state.recommendations?.recommendations?.length ?? 0) === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-sm muted" colSpan={4}>No recommendations for this filter.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </section>

      {rejectUserId ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4">
          <div className="surface w-full max-w-md p-5">
            <h3 className="text-lg font-bold text-[var(--ink)]">Reject Account</h3>
            <p className="mt-1 text-sm muted">Provide the reason shown to the student.</p>
            <textarea
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={4}
              className="input-clean mt-3"
              placeholder="Reason for rejection"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setRejectUserId(null)}>Cancel</button>
              <button
                type="button"
                className="rounded-lg border border-[var(--accent-red)]/35 bg-[color-mix(in_srgb,#fff_82%,#f8e3dd_18%)] px-4 py-2 text-sm font-semibold text-[var(--accent-red)] disabled:opacity-60"
                disabled={busyKey === `reject-${rejectUserId}`}
                onClick={() => {
                  void rejectUser();
                }}
              >
                {busyKey === `reject-${rejectUserId}` ? "Rejecting..." : "Reject User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {focusedUser ? (
        <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md border-l border-[var(--surface-stroke)] bg-white p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="inline-flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
                <Users className="h-4 w-4" />
                User Detail
              </h3>
              <p className="mt-1 text-sm muted">Moderation and profile controls.</p>
            </div>
            <button type="button" className="btn-secondary px-3 py-1 text-xs" onClick={() => setFocusedUserId(null)}>Close</button>
          </div>

          <div className="mt-4 surface-soft p-4">
            <div className="flex items-center gap-3">
              <UserAvatar username={focusedUser.username} house={focusedUser.house} avatarUrl={focusedUser.avatarUrl} size={42} />
              <div>
                <p className="font-semibold text-[var(--ink)]">@{focusedUser.username}</p>
                <p className="text-xs muted">{focusedUser.email}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <span className="pill">{focusedUser.status}</span>
              <HouseBadge house={focusedUser.house} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <section className="surface-soft p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] muted">Change House</p>
              <select className="input-clean text-sm" value={focusedUserHouse} onChange={(event) => setFocusedUserHouse(event.target.value as HouseId)}>
                {HOUSE_IDS.map((id) => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-secondary mt-2 w-full px-3 py-2 text-xs disabled:opacity-60"
                disabled={busyKey === `house-${focusedUser.id}`}
                onClick={() => {
                  void saveFocusedUserHouse();
                }}
              >
                Save House
              </button>
            </section>

            <section className="surface-soft p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] muted">Add Points</p>
              <input className="input-clean text-sm" value={focusedUserPoints} onChange={(event) => setFocusedUserPoints(event.target.value)} />
              <textarea
                className="input-clean mt-2 text-sm"
                rows={2}
                value={focusedUserReason}
                onChange={(event) => setFocusedUserReason(event.target.value)}
                placeholder="Reason"
              />
              <button
                type="button"
                className="btn-secondary mt-2 w-full px-3 py-2 text-xs disabled:opacity-60"
                disabled={busyKey === `points-${focusedUser.id}`}
                onClick={() => {
                  void adjustFocusedUserPoints();
                }}
              >
                Add Points
              </button>
            </section>

            <section className="surface-soft p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] muted">Ban Controls</p>
              <textarea
                className="input-clean text-sm"
                rows={2}
                value={focusedUserReason}
                onChange={(event) => setFocusedUserReason(event.target.value)}
                placeholder="Reason"
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--accent-red)]/35 bg-[color-mix(in_srgb,#fff_82%,#f8e3dd_18%)] px-3 py-2 text-xs font-semibold text-[var(--accent-red)] disabled:opacity-60"
                  disabled={busyKey === `ban-${focusedUser.id}` || focusedUser.status === "banned"}
                  onClick={() => {
                    void setFocusedUserBanned(true);
                  }}
                >
                  <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5" />Ban</span>
                </button>
                <button
                  type="button"
                  className="btn-secondary px-3 py-2 text-xs disabled:opacity-60"
                  disabled={busyKey === `ban-${focusedUser.id}` || focusedUser.status !== "banned"}
                  onClick={() => {
                    void setFocusedUserBanned(false);
                  }}
                >
                  Unban
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {marketMakerOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-4">
          <div className="surface max-h-[92vh] w-full max-w-2xl overflow-y-auto p-5">
            <h3 className="text-xl font-bold text-[var(--ink)]">Market Maker</h3>
            <p className="mt-1 text-sm muted">Create binary markets now. Multi markets are visible but locked for student trading.</p>

            <div className="mt-4 grid gap-3">
              <input className="input-clean" value={marketTitle} onChange={(event) => setMarketTitle(event.target.value)} placeholder="Market title" />
              <textarea className="input-clean" rows={3} value={marketDescription} onChange={(event) => setMarketDescription(event.target.value)} placeholder="Market description" />

              <div className="grid gap-3 sm:grid-cols-2">
                <select className="input-clean" value={marketCategory} onChange={(event) => setMarketCategory(event.target.value)}>
                  <option value="Sports">Sports</option>
                  <option value="Campus">Campus</option>
                  <option value="Pop Culture">Pop Culture</option>
                  <option value="Academic">Academic</option>
                  <option value="Other">Other</option>
                </select>
                <select className="input-clean" value={marketType} onChange={(event) => setMarketType(event.target.value as "binary" | "multi") }>
                  <option value="binary">Binary</option>
                  <option value="multi">Multi (locked in student UI)</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  className="input-clean"
                  value={marketCloseTime}
                  onChange={(event) => setMarketCloseTime(event.target.value)}
                />
                <input
                  className="input-clean"
                  value={marketLiquidity}
                  onChange={(event) => setMarketLiquidity(event.target.value)}
                  placeholder="Liquidity parameter (b)"
                />
              </div>

              <textarea
                className="input-clean"
                rows={4}
                value={marketCriteria}
                onChange={(event) => setMarketCriteria(event.target.value)}
                placeholder="Resolution criteria (minimum 100 characters)"
              />

              {marketType === "multi" ? (
                <textarea
                  className="input-clean"
                  rows={4}
                  value={marketOptionsRaw}
                  onChange={(event) => setMarketOptionsRaw(event.target.value)}
                  placeholder="One option per line"
                />
              ) : null}

              <label className="inline-flex items-center gap-2 text-sm ink-soft">
                <input type="checkbox" checked={marketFeatured} onChange={(event) => setMarketFeatured(event.target.checked)} />
                Featured market
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className="btn-secondary px-4 py-2 text-sm" onClick={() => setMarketMakerOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                disabled={busyKey === "market-create"}
                onClick={() => {
                  void createMarket();
                }}
              >
                {busyKey === "market-create" ? "Creating..." : "Create Market"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthenticatedShell>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={(
        <AuthenticatedShell viewer={null}>
          <LoadingState title="Loading Admin Workspace..." />
        </AuthenticatedShell>
      )}
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
