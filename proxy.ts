import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { updateSession } from "@/lib/supabase/middleware";

const AUTH_REQUIRED_PREFIXES = [
  "/home",
  "/market",
  "/portfolio",
  "/watchlist",
  "/settings",
  "/leaderboard",
  "/pending",
  "/banned",
  "/admin",
];

function startsWithAny(pathname: string, prefixes: string[]) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requiresAuth = startsWithAny(pathname, AUTH_REQUIRED_PREFIXES);

  const { response, supabase, user } = await updateSession(request);

  if (!user) {
    if (requiresAuth) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

  if (!supabase) {
    return response;
  }

  if (!isAllowedSchoolEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/domain-denied", request.url));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("status, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    if (!pathname.startsWith("/profile/setup")) {
      return NextResponse.redirect(new URL("/profile/setup", request.url));
    }

    return response;
  }

  if (pathname.startsWith("/admin") && !profile.is_admin) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (profile.status === "pending" && !pathname.startsWith("/pending") && !pathname.startsWith("/profile/setup")) {
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  if (profile.status === "banned" && !pathname.startsWith("/banned")) {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  if (profile.status === "active" && (pathname.startsWith("/pending") || pathname.startsWith("/banned"))) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
