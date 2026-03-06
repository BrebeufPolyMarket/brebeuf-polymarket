-- Refresh house standings once per payout batch (statement-level), not once per row.
-- This prevents repeated lead-change bonuses during a single market resolution.

drop trigger if exists transactions_refresh_houses_after_payout on public.transactions;

drop function if exists public.on_payout_refresh_houses();

create or replace function public.on_payout_refresh_houses_stmt()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from new_rows where type = 'payout') then
    perform public.refresh_house_standings();
  end if;

  return null;
end;
$$;

create trigger transactions_refresh_houses_after_payout
after insert on public.transactions
referencing new table as new_rows
for each statement
execute function public.on_payout_refresh_houses_stmt();
