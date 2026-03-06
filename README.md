# Brebeuf Polymarket

Campus prediction market platform for Brebeuf College School.

## Stack

- Next.js (App Router, TypeScript)
- Tailwind CSS
- Supabase (Auth, Postgres, Realtime)
- Vitest for LMSR unit tests

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Supabase Setup

1. Initialize project config (already done in this repo):

```bash
supabase init
```

2. Start local stack (requires Docker Desktop / daemon):

```bash
supabase start
```

3. Apply migrations locally:

```bash
supabase db reset
```

4. Link to a cloud project and push migrations:

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run lint` - lint the project
- `npm run test` - run unit tests (LMSR)
- `npm run test:integration` - run local Supabase integration checks
- `npm run typecheck` - run TypeScript checks

## Database

Initial schema + RLS + functions live in:

- `supabase/migrations/20260306110000_initial_schema.sql`
- `supabase/migrations/20260306113000_trading_core_hardening.sql`

Migrations include:

- Full table set from the build plan (`users`, `houses`, `markets`, `market_options`, `positions`, `transactions`, etc.)
- House standings recalculation and lead-change events
- `approve_user` and `reject_user` admin functions
- `place_binary_bet` + `place_binary_sell` RPCs with row locks (`FOR UPDATE`)
- `resolve_binary_market` and `cancel_market` RPCs for admin lifecycle actions
- Idempotency support (`transactions.client_tx_id`) and DB-side bet rate limiting

## Environment

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ALLOWED_EMAIL_DOMAIN` (default `brebeuf.ca`)
- `SUPABASE_URL` (optional, for integration tests)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, for integration tests)

## Key Files

- `lib/lmsr.ts` - LMSR engine math functions
- `lib/data/live.ts` - live Supabase query layer for home/market/portfolio/leaderboard
- `app/api/bet/route.ts` - buy API endpoint (idempotent)
- `app/api/sell/route.ts` - sell API endpoint (idempotent)
- `app/api/admin/markets/[id]/resolve/route.ts` - admin resolve API
- `app/api/admin/markets/[id]/cancel/route.ts` - admin cancel API
- `tests/integration/trading-core.integration.test.ts` - local Supabase integration checks
