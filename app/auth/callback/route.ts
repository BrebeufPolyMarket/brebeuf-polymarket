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
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/?error=auth_required", request.url));
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
    return NextResponse.redirect(new URL("/pending", request.url));
  }

  if (profile.status === "banned") {
    return NextResponse.redirect(new URL("/banned", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
