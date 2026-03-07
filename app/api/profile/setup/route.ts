import { NextResponse } from "next/server";
import { z } from "zod";

import { isAllowedSchoolEmail } from "@/lib/auth/domain";
import { HOUSE_IDS } from "@/lib/houses";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const setupSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9_]+$/),
  house: z.enum(HOUSE_IDS),
  gradeYear: z.number().int().min(9).max(12),
  bio: z.string().trim().max(160).optional().default(""),
  favouriteSubject: z.string().trim().max(80).optional().default(""),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = setupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Profile setup payload is invalid.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        error: "NOT_AUTHENTICATED",
        message: "Sign in is required.",
      },
      { status: 401 },
    );
  }

  if (!isAllowedSchoolEmail(user.email)) {
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        error: "DOMAIN_NOT_ALLOWED",
        message: "A TCDSB school email is required.",
      },
      { status: 403 },
    );
  }

  const { data: existing } = await supabase
    .from("users")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (existing?.status === "active") {
    return NextResponse.json(
      {
        error: "ALREADY_ACTIVE",
        message: "Profile is already active.",
      },
      { status: 409 },
    );
  }

  const { error } = await supabase.from("users").upsert(
    {
      id: user.id,
      email: user.email,
      full_name: parsed.data.fullName,
      username: parsed.data.username,
      house: parsed.data.house,
      house_confirmed: false,
      grade_year: parsed.data.gradeYear,
      bio: parsed.data.bio || null,
      favourite_subject: parsed.data.favouriteSubject || null,
      status: "pending",
      points_balance: 0,
      is_admin: false,
    },
    { onConflict: "id" },
  );

  if (error) {
    if (error.message.includes("users_username_key")) {
      return NextResponse.json(
        {
          error: "USERNAME_TAKEN",
          message: "Username is already in use.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "SETUP_FAILED",
        message: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, redirectTo: "/home" });
}
