import { NextResponse } from "next/server";
import { z } from "zod";

import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const signUpSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(payload);

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
        message: "Use your TCDSB school email address.",
      },
      { status: 403 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("already")) {
      return NextResponse.json(
        {
          error: "EMAIL_IN_USE",
          message: "This email is already registered. Try signing in.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "SIGNUP_FAILED",
        message: error.message,
      },
      { status: 400 },
    );
  }

  let hasSession = Boolean(data.session);

  // Confirmation is disabled, but on some auth-edge cases the session can be null.
  // Attempt a single sign-in so onboarding can continue immediately.
  if (!hasSession) {
    const signInResult = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (!signInResult.error && signInResult.data.session) {
      hasSession = true;
    }
  }

  return NextResponse.json({
    ok: true,
    redirectTo: hasSession ? "/profile/setup" : "/auth/login",
    message: hasSession
      ? "Account created. Continue to your profile quiz."
      : "Account created. Sign in to continue to your profile quiz.",
  });
}
