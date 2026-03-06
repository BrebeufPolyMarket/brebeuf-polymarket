import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const paramsSchema = z.object({
  id: z.string().uuid(),
});

const bodySchema = z.object({
  winningOptionId: z.string().uuid(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const resolvedParams = paramsSchema.safeParse(await params);
  if (!resolvedParams.success) {
    return NextResponse.json(
      { error: "INVALID_MARKET_ID", message: "Invalid market id." },
      { status: 400 },
    );
  }

  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid resolve payload.",
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

    const { data: preview, error: previewError } = await supabase.rpc("preview_market_resolution", {
      p_market_id: resolvedParams.data.id,
      p_winning_option_id: parsedBody.data.winningOptionId,
    });

    if (previewError) {
      return toApiErrorResponse(previewError);
    }

    const { data: resolution, error: resolutionError } = await supabase.rpc("resolve_binary_market", {
      p_market_id: resolvedParams.data.id,
      p_winning_option_id: parsedBody.data.winningOptionId,
      p_admin_id: user.id,
    });

    if (resolutionError) {
      return toApiErrorResponse(resolutionError);
    }

    return NextResponse.json({
      ok: true,
      preview,
      result: resolution,
    });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
