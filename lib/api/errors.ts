import { NextResponse } from "next/server";

const DOMAIN_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  NOT_AUTHENTICATED: { status: 401, code: "NOT_AUTHENTICATED", message: "You must sign in to continue." },
  PROFILE_NOT_FOUND: { status: 404, code: "PROFILE_NOT_FOUND", message: "Profile not found." },
  NOT_ACTIVE: { status: 403, code: "NOT_ACTIVE", message: "Only active users can perform this action." },
  NOT_ADMIN: { status: 403, code: "NOT_ADMIN", message: "Admin privileges are required." },
  RATE_LIMITED: { status: 429, code: "RATE_LIMITED", message: "Too many bets in a short period. Try again soon." },
  INSUFFICIENT_BALANCE: { status: 400, code: "INSUFFICIENT_BALANCE", message: "Insufficient points balance." },
  INSUFFICIENT_SHARES: { status: 400, code: "INSUFFICIENT_SHARES", message: "You do not have enough shares to sell." },
  POSITION_NOT_FOUND: { status: 404, code: "POSITION_NOT_FOUND", message: "Open position not found." },
  MARKET_NOT_FOUND: { status: 404, code: "MARKET_NOT_FOUND", message: "Market not found." },
  MARKET_NOT_BINARY: { status: 400, code: "MARKET_NOT_BINARY", message: "This action supports binary markets only." },
  MARKET_NOT_ACTIVE: { status: 400, code: "MARKET_NOT_ACTIVE", message: "Market is not active." },
  MARKET_CLOSED: { status: 400, code: "MARKET_CLOSED", message: "Market is closed." },
  MARKET_ALREADY_FINALIZED: { status: 400, code: "MARKET_ALREADY_FINALIZED", message: "Market is already resolved or cancelled." },
  INVALID_OPTION: { status: 400, code: "INVALID_OPTION", message: "Selected option is invalid for this market." },
  MARKET_INVALID_OPTIONS: { status: 500, code: "MARKET_INVALID_OPTIONS", message: "Market options are misconfigured." },
  BET_POINTS_INVALID: { status: 400, code: "BET_POINTS_INVALID", message: "Bet points must be a positive integer." },
  SELL_SHARES_INVALID: { status: 400, code: "SELL_SHARES_INVALID", message: "Sell shares must be positive." },
  BET_TOO_SMALL_AFTER_FEE: { status: 400, code: "BET_TOO_SMALL_AFTER_FEE", message: "Bet amount is too small after fee." },
  CALCULATED_SHARES_INVALID: { status: 500, code: "CALCULATED_SHARES_INVALID", message: "Unable to calculate shares." },
  RECOMMENDATION_NOT_FOUND: { status: 404, code: "RECOMMENDATION_NOT_FOUND", message: "Market recommendation not found." },
  INVALID_RECOMMENDATION_STATUS: { status: 400, code: "INVALID_RECOMMENDATION_STATUS", message: "Invalid recommendation status." },
};

function extractErrorCode(err: unknown) {
  if (!err) return null;

  const maybeObject = err as { message?: string };
  if (typeof maybeObject.message === "string" && DOMAIN_ERRORS[maybeObject.message]) {
    return maybeObject.message;
  }

  if (typeof err === "string" && DOMAIN_ERRORS[err]) {
    return err;
  }

  return null;
}

export function toApiErrorResponse(err: unknown, fallbackMessage = "Request failed.") {
  const code = extractErrorCode(err);

  if (code) {
    const mapped = DOMAIN_ERRORS[code];
    return NextResponse.json(
      {
        error: mapped.code,
        message: mapped.message,
      },
      { status: mapped.status },
    );
  }

  const maybeObject = err as { message?: string };
  return NextResponse.json(
    {
      error: "UNKNOWN_ERROR",
      message: maybeObject?.message ?? fallbackMessage,
    },
    { status: 500 },
  );
}
