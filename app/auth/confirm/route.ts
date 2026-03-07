import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(nextParam: string | null) {
  if (!nextParam) return "/home";
  if (!nextParam.startsWith("/")) return "/home";
  if (nextParam.startsWith("//")) return "/home";
  return nextParam;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"));

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/login?error=invalid_confirmation_link", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(new URL("/auth/login?error=confirmation_failed", request.url));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/login?error=auth_required", request.url));
  }

  if (!isAllowedSchoolEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/auth/domain-denied", request.url));
  }

  const { data: profile } = await supabase
    .from("users")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return NextResponse.redirect(new URL("/profile/setup", request.url));
  }

  if (profile.status === "pending") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  if (profile.status === "banned") {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
