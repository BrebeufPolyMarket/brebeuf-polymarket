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

  const requestUrl = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${requestUrl.origin}/auth/confirm`,
    },
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

  return NextResponse.json({
    ok: true,
    requiresEmailConfirmation: !data.session,
    message: "Check your email to confirm your account.",
  });
}
