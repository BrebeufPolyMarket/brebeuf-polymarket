import { NextResponse } from "next/server";
import { z } from "zod";

import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1).max(72),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = signInSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Email and password are required.",
      },
      { status: 400 },
    );
  }

  if (!isAllowedSchoolEmail(parsed.data.email)) {
    return NextResponse.json(
      {
        error: "DOMAIN_NOT_ALLOWED",
        message: "Use your Brebeuf school email address.",
      },
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("email not confirmed")) {
      return NextResponse.json(
        {
          error: "EMAIL_NOT_CONFIRMED",
          message: "Confirm your email before signing in.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        error: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
      { status: 401 },
    );
  }

  const userId = data.user.id;
  const { data: profile } = await supabase
    .from("users")
    .select("status")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ ok: true, redirectTo: "/profile/setup" });
  }

  if (profile.status === "pending") {
    return NextResponse.json({ ok: true, redirectTo: "/pending" });
  }

  if (profile.status === "banned") {
    return NextResponse.json({ ok: true, redirectTo: "/banned" });
  }

  return NextResponse.json({ ok: true, redirectTo: "/home" });
}
