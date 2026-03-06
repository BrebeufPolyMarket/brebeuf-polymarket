import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const recommendationSchema = z.object({
  title: z.string().trim().min(6).max(160),
  description: z.string().trim().min(20).max(2000),
  category: z.enum(["Sports", "Campus", "Pop Culture", "Academic", "Other"]),
  sourceUrl: z.string().trim().url().max(500).optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid market recommendation payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return toApiErrorResponse("NOT_AUTHENTICATED");
    }

    const { data: profile } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return toApiErrorResponse("PROFILE_NOT_FOUND");
    }

    if (profile.status !== "active") {
      return toApiErrorResponse("NOT_ACTIVE");
    }

    const { data, error } = await supabase
      .from("market_recommendations")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description,
        category: parsed.data.category,
        source_url: parsed.data.sourceUrl?.trim() || null,
        status: "open",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "SUBMIT_FAILED",
          message: "Unable to submit recommendation right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: data.id,
    });
  } catch (error) {
    return toApiErrorResponse(error, "Failed to submit recommendation.");
  }
}
