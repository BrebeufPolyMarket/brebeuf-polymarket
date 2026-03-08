"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getAllowedEmailDomain, isAllowedSchoolEmail } from "@/lib/auth/domain";
import type { ViewerProfile } from "@/lib/data/types";
import { isHouseId } from "@/lib/houses";

export type ViewerLoadResult = {
  viewer: ViewerProfile | null;
  userId: string | null;
};

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export async function getViewerProfileClient(): Promise<ViewerLoadResult> {
  const supabase = createSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { viewer: null, userId: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("id, email, username, house, avatar_url, profile_completed_at, points_balance, lifetime_won, win_count, loss_count, status, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !isHouseId(profile.house)) {
    return { viewer: null, userId: user.id };
  }

  return {
    userId: user.id,
    viewer: {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      house: profile.house,
      avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
      profileCompletedAt: profile.profile_completed_at ? String(profile.profile_completed_at) : null,
      pointsBalance: toNumber(profile.points_balance),
      lifetimeWon: toNumber(profile.lifetime_won),
      winCount: toNumber(profile.win_count),
      lossCount: toNumber(profile.loss_count),
      status: profile.status === "active" ? "active" : profile.status === "banned" ? "banned" : "pending",
      isAdmin: Boolean(profile.is_admin),
    },
  };
}

export async function requireSchoolDomainOrSignOut(email: string | null | undefined) {
  if (isAllowedSchoolEmail(email)) return true;
  const supabase = createSupabaseBrowserClient();
  await supabase.auth.signOut();
  return false;
}

export function getSchoolDomainLabel() {
  return `@${getAllowedEmailDomain()}`;
}

export function normalizeEmail(email: string) {
  return asString(email, "").trim().toLowerCase();
}
