import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const watchlistSchema = z.object({
  marketId: z.string().uuid(),
});

async function requireActiveUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: "NOT_AUTHENTICATED" as const };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return { supabase, user: null, error: "PROFILE_NOT_FOUND" as const };
  }

  if (profile.status !== "active") {
    return { supabase, user: null, error: "NOT_ACTIVE" as const };
  }

  return { supabase, user, error: null };
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = watchlistSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid watchlist payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const auth = await requireActiveUser();
    if (auth.error) {
      return toApiErrorResponse(auth.error);
    }

    const { error } = await auth.supabase.from("watchlist").insert({
      user_id: auth.user.id,
      market_id: parsed.data.marketId,
    });

    if (error && error.code !== "23505") {
      return NextResponse.json(
        {
          error: "SAVE_FAILED",
          message: "Unable to save this market to watchlist.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      isWatchlisted: true,
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to update watchlist.");
  }
}

export async function DELETE(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = watchlistSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid watchlist payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const auth = await requireActiveUser();
    if (auth.error) {
      return toApiErrorResponse(auth.error);
    }

    const { error } = await auth.supabase
      .from("watchlist")
      .delete()
      .eq("user_id", auth.user.id)
      .eq("market_id", parsed.data.marketId);

    if (error) {
      return NextResponse.json(
        {
          error: "REMOVE_FAILED",
          message: "Unable to remove this market from watchlist.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      isWatchlisted: false,
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to update watchlist.");
  }
}
