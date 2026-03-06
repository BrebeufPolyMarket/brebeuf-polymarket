import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  gradeYear: z.number().int().min(9).max(12).nullable(),
  favouriteSubject: z.string().trim().max(80),
  bio: z.string().trim().max(160),
  notifyMarketClose: z.boolean(),
  notifyWatchlistMove: z.boolean(),
  notifyHouseEvents: z.boolean(),
  notifyCommentReplies: z.boolean(),
}).strict();

export async function PATCH(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = settingsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid settings payload.",
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

    if (profile.status === "banned") {
      return NextResponse.json(
        {
          error: "ACCOUNT_BANNED",
          message: "Banned accounts cannot update settings.",
        },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from("users")
      .update({
        full_name: parsed.data.fullName,
        grade_year: parsed.data.gradeYear,
        favourite_subject: parsed.data.favouriteSubject || null,
        bio: parsed.data.bio || null,
        notify_market_close: parsed.data.notifyMarketClose,
        notify_watchlist_move: parsed.data.notifyWatchlistMove,
        notify_house_events: parsed.data.notifyHouseEvents,
        notify_comment_replies: parsed.data.notifyCommentReplies,
      })
      .eq("id", user.id);

    if (error) {
      return NextResponse.json(
        {
          error: "UPDATE_FAILED",
          message: "Unable to save settings right now.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to update settings.");
  }
}
