import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasEnv = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasEnv)("trading core integration (local supabase)", () => {
  function client() {
    return createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  }

  it("has seeded canonical house colours", async () => {
    const supabase = client();
    const { data, error } = await supabase
      .from("houses")
      .select("id, colour_hex")
      .order("id", { ascending: true });

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data!.length).toBe(6);

    const colours = Object.fromEntries(data!.map((row) => [row.id, row.colour_hex]));

    expect(colours.lalemant).toBe("#111111");
    expect(colours.jogues).toBe("#F1C40F");
    expect(colours.lalande).toBe("#2471A3");
    expect(colours.garnier).toBe("#7F8C8D");
    expect(colours.chabanel).toBe("#C0392B");
    expect(colours.daniel).toBe("#1E8449");
  });

  it("exposes trading core RPCs", async () => {
    const supabase = client();
    const emptyUuid = "00000000-0000-0000-0000-000000000000";

    const buy = await supabase.rpc("place_binary_bet", {
      p_market_id: emptyUuid,
      p_option_id: emptyUuid,
      p_points: 10,
      p_client_tx_id: emptyUuid,
    });

    const sell = await supabase.rpc("place_binary_sell", {
      p_market_id: emptyUuid,
      p_option_id: emptyUuid,
      p_shares: 1,
      p_client_tx_id: emptyUuid,
    });

    const resolve = await supabase.rpc("resolve_binary_market", {
      p_market_id: emptyUuid,
      p_winning_option_id: emptyUuid,
      p_admin_id: emptyUuid,
    });

    const cancel = await supabase.rpc("cancel_market", {
      p_market_id: emptyUuid,
      p_admin_id: emptyUuid,
      p_reason: "test",
    });

    expect(buy.error).toBeTruthy();
    expect(sell.error).toBeTruthy();
    expect(resolve.error).toBeTruthy();
    expect(cancel.error).toBeTruthy();

    expect(buy.error?.message).toContain("NOT_AUTHENTICATED");
    expect(sell.error?.message).toContain("NOT_AUTHENTICATED");
    expect(resolve.error?.message).toContain("NOT_AUTHENTICATED");
    expect(cancel.error?.message).toContain("NOT_AUTHENTICATED");
  });
});
