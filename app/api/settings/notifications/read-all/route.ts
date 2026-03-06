import { NextResponse } from "next/server";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return toApiErrorResponse("NOT_AUTHENTICATED");
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (error) {
      return NextResponse.json(
        {
          error: "UPDATE_FAILED",
          message: "Unable to mark notifications as read.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "All notifications marked as read.",
    });
  } catch (error) {
    return toApiErrorResponse(error, "Unable to mark notifications as read.");
  }
}
