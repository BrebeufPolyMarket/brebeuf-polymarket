create table if not exists public.market_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null,
  category text not null check (category in ('Sports', 'Campus', 'Pop Culture', 'Academic', 'Other')),
  source_url text,
  status text not null default 'open' check (status in ('open', 'under_review', 'accepted', 'rejected')),
  admin_notes text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id)
);

create index if not exists market_recommendations_status_created_idx
  on public.market_recommendations (status, created_at desc);

create index if not exists market_recommendations_user_created_idx
  on public.market_recommendations (user_id, created_at desc);

alter table public.market_recommendations enable row level security;

drop policy if exists "active users create own recommendations" on public.market_recommendations;
create policy "active users create own recommendations"
  on public.market_recommendations
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
    and status = 'open'
  );

drop policy if exists "users read own recommendations" on public.market_recommendations;
create policy "users read own recommendations"
  on public.market_recommendations
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "admins manage recommendations" on public.market_recommendations;
create policy "admins manage recommendations"
  on public.market_recommendations
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create or replace function public.review_market_recommendation(
  p_recommendation_id uuid,
  p_status text,
  p_admin_notes text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_recommendation record;
  v_next_status text;
  v_notes text;
begin
  v_auth_user := auth.uid();

  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  v_next_status := lower(trim(coalesce(p_status, '')));
  if v_next_status not in ('open', 'under_review', 'accepted', 'rejected') then
    raise exception 'INVALID_RECOMMENDATION_STATUS';
  end if;

  select *
  into v_recommendation
  from public.market_recommendations
  where id = p_recommendation_id
  for update;

  if v_recommendation.id is null then
    raise exception 'RECOMMENDATION_NOT_FOUND';
  end if;

  v_notes := nullif(trim(coalesce(p_admin_notes, '')), '');

  update public.market_recommendations
  set
    status = v_next_status,
    admin_notes = v_notes,
    reviewed_at = case when v_next_status = 'open' then null else now() end,
    reviewed_by = case when v_next_status = 'open' then null else p_admin_id end
  where id = p_recommendation_id;

  perform public.log_admin_action(
    p_admin_id,
    'market_recommendation_reviewed',
    'market_recommendation',
    p_recommendation_id,
    format('Status %s -> %s. Notes: %s', v_recommendation.status, v_next_status, coalesce(v_notes, '-'))
  );

  return jsonb_build_object(
    'id', p_recommendation_id,
    'status', v_next_status,
    'reviewed_at', case when v_next_status = 'open' then null else now() end,
    'reviewed_by', case when v_next_status = 'open' then null else p_admin_id end
  );
end;
$$;

grant select, insert, update on table public.market_recommendations to authenticated;
grant execute on function public.review_market_recommendation(uuid, text, text, uuid) to authenticated;

comment on table public.market_recommendations is
  'Student-submitted market ideas. Only admins can review and create actual markets.';
