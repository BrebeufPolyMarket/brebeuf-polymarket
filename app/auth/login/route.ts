import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

function safeNextPath(nextParam: string | null) {
  if (!nextParam) return "/home";
  if (!nextParam.startsWith("/")) return "/home";
  if (nextParam.startsWith("//")) return "/home";
  return nextParam;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${url.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/?error=oauth_start_failed", request.url));
  }

  return NextResponse.redirect(data.url);
}
