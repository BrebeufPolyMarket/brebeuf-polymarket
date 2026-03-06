import { NextResponse } from "next/server";
import { z } from "zod";

import { toApiErrorResponse } from "@/lib/api/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const betSchema = z.object({
  marketId: z.string().uuid(),
  optionId: z.string().uuid(),
  points: z.number().int().positive(),
  clientTxId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const parsed = betSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "INVALID_PAYLOAD",
        message: "Invalid bet payload.",
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

    const { data, error } = await supabase.rpc("place_binary_bet", {
      p_market_id: parsed.data.marketId,
      p_option_id: parsed.data.optionId,
      p_points: parsed.data.points,
      p_client_tx_id: parsed.data.clientTxId ?? null,
    });

    if (error) {
      return toApiErrorResponse(error);
    }

    return NextResponse.json({ ok: true, result: data });
  } catch (error) {
    return toApiErrorResponse(error);
  }
}
