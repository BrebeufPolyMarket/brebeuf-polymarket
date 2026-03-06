-- Ensure lead-change banner/bonus triggers only on payout-driven standings changes,
-- not on membership changes (approval/house transfer).

create or replace function public.refresh_house_standings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_leader text;
  new_leader text;
  enable_bonus boolean := coalesce(current_setting('app.enable_house_bonus', true), '') = 'on';
begin
  select id into old_leader from public.houses where rank = 1;

  update public.houses h
  set total_points = coalesce(t.total_points, 0)
  from (
    select house_at_tx as house_id, sum(points_delta)::int as total_points
    from public.transactions
    where type = 'payout' and house_at_tx is not null
    group by house_at_tx
  ) t
  where h.id = t.house_id;

  update public.houses
  set total_points = 0
  where id not in (
    select distinct house_at_tx
    from public.transactions
    where type = 'payout' and house_at_tx is not null
  );

  update public.houses h
  set member_count = coalesce(m.member_count, 0)
  from (
    select house as house_id, count(*)::int as member_count
    from public.users
    where status = 'active'
    group by house
  ) m
  where h.id = m.house_id;

  update public.houses
  set member_count = 0
  where id not in (
    select distinct house
    from public.users
    where status = 'active'
  );

  with ranked as (
    select
      id,
      row_number() over (order by total_points desc, member_count desc, id asc) as new_rank
    from public.houses
  )
  update public.houses h
  set previous_rank = h.rank,
      rank = r.new_rank
  from ranked r
  where h.id = r.id;

  select id into new_leader from public.houses where rank = 1;

  if enable_bonus and new_leader is not null and old_leader is distinct from new_leader then
    insert into public.house_events (event_type, house_id, payload)
    values (
      'house_lead_change',
      new_leader,
      jsonb_build_object('previous_leader', old_leader, 'new_leader', new_leader)
    );

    with credited as (
      update public.users
      set points_balance = points_balance + 5
      where status = 'active' and house = new_leader
      returning id, points_balance
    )
    insert into public.transactions (user_id, type, points_delta, balance_after, house_at_tx)
    select id, 'house_lead_bonus', 5, points_balance, new_leader
    from credited;
  end if;
end;
$$;

create or replace function public.on_payout_refresh_houses_stmt()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from new_rows where type = 'payout') then
    perform set_config('app.enable_house_bonus', 'on', true);
    perform public.refresh_house_standings();
  end if;

  return null;
end;
$$;

create or replace function public.on_user_membership_change_refresh_houses()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_house_standings();
  return null;
end;
$$;

create or replace function public.approve_user(
  p_user_id uuid,
  p_admin_id uuid,
  p_house_override text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_house text;
  current_status text;
  original_house text;
begin
  if not public.is_admin_user(p_admin_id) then
    raise exception 'Only admins can approve users';
  end if;

  select status, house
  into current_status, original_house
  from public.users
  where id = p_user_id
  for update;

  if current_status is null then
    raise exception 'User not found';
  end if;

  if current_status != 'pending' then
    raise exception 'Only pending users can be approved';
  end if;

  selected_house := coalesce(p_house_override, original_house);

  update public.users
  set
    status = 'active',
    house = selected_house,
    house_confirmed = true,
    points_balance = 100,
    approved_at = now(),
    approved_by = p_admin_id
  where id = p_user_id;

  insert into public.transactions (
    user_id,
    type,
    points_delta,
    balance_after
  )
  values (p_user_id, 'signup_bonus', 100, 100);

  insert into public.notifications (
    user_id,
    type,
    title,
    body
  )
  values (
    p_user_id,
    'approval',
    'Account Approved',
    'Your Brebeuf Polymarket account is now active. You have received 100 starting points.'
  );

  perform public.log_admin_action(
    p_admin_id,
    'account_approved',
    'user',
    p_user_id,
    case
      when p_house_override is not null and p_house_override != original_house
      then format('House overridden from %s to %s', original_house, p_house_override)
      else 'Approved without house override'
    end
  );

  if p_house_override is not null and p_house_override != original_house then
    perform public.log_admin_action(
      p_admin_id,
      'house_overridden',
      'user',
      p_user_id,
      format('House overridden from %s to %s during approval', original_house, p_house_override)
    );
  end if;

  perform public.refresh_house_standings();
end;
$$;
