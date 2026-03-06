import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  status: z.enum(["under_review", "accepted", "rejected"]),
  adminNotes: z.string().trim().max(2000).optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const resolvedParams = paramsSchema.safeParse(await params);
  if (!resolvedParams.success) {
    return NextResponse.json(
      { error: "INVALID_RECOMMENDATION_ID", message: "Invalid recommendation id." },
      { status: 400 },
    );
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid recommendation review payload.",
        details: parsedBody.error.flatten(),
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

    const { data: adminProfile } = await supabase
      .from("users")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminProfile?.is_admin) {
      return toApiErrorResponse("NOT_ADMIN");
    }

    const { data, error } = await supabase.rpc("review_market_recommendation", {
      p_recommendation_id: resolvedParams.data.id,
      p_status: parsedBody.data.status,
      p_admin_notes: parsedBody.data.adminNotes ?? null,
      p_admin_id: user.id,
    });

    if (error) {
      return toApiErrorResponse(error);
    }

    return NextResponse.json({ ok: true, result: data });
  } catch {
    return NextResponse.json(
      {
        error: "UPDATE_FAILED",
        message: "Unable to update recommendation right now.",
      },
      { status: 500 },
    );
  }
}
