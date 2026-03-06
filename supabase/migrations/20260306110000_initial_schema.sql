create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  avatar_url text,
  house text not null check (house in ('lalemant', 'jogues', 'lalande', 'garnier', 'chabanel', 'daniel')),
  house_confirmed boolean not null default false,
  bio text check (char_length(coalesce(bio, '')) <= 160),
  grade_year int check (grade_year between 9 and 12),
  favourite_subject text,
  points_balance int not null default 0 check (points_balance >= 0),
  lifetime_won int not null default 0 check (lifetime_won >= 0),
  total_wagered int not null default 0 check (total_wagered >= 0),
  win_count int not null default 0 check (win_count >= 0),
  loss_count int not null default 0 check (loss_count >= 0),
  biggest_win int not null default 0 check (biggest_win >= 0),
  status text not null default 'pending' check (status in ('pending', 'active', 'banned')),
  is_admin boolean not null default false,
  referral_code text unique,
  referred_by uuid references public.users (id),
  daily_login_streak int not null default 0 check (daily_login_streak >= 0),
  last_login_date date,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references public.users (id)
);

create table if not exists public.houses (
  id text primary key check (id in ('lalemant', 'jogues', 'lalande', 'garnier', 'chabanel', 'daniel')),
  display_name text not null,
  colour_hex text not null check (colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
  total_points int not null default 0 check (total_points >= 0),
  member_count int not null default 0 check (member_count >= 0),
  rank int check (rank between 1 and 6),
  previous_rank int check (previous_rank between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.markets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category text not null check (category in ('Sports', 'Campus', 'Pop Culture', 'Academic', 'Other')),
  type text not null check (type in ('binary', 'multi')),
  status text not null default 'active' check (status in ('active', 'closed', 'resolved', 'cancelled')),
  is_featured boolean not null default false,
  close_time timestamptz not null,
  resolved_at timestamptz,
  resolution_value text,
  liquidity_param double precision not null default 100 check (liquidity_param > 0),
  total_volume int not null default 0 check (total_volume >= 0),
  trader_count int not null default 0 check (trader_count >= 0),
  fee_rate double precision not null default 0.02 check (fee_rate >= 0 and fee_rate <= 1),
  fee_pool int not null default 0 check (fee_pool >= 0),
  resolution_criteria text not null check (char_length(resolution_criteria) >= 100),
  created_at timestamptz not null default now(),
  created_by uuid not null references public.users (id)
);

create table if not exists public.market_options (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  label text not null,
  shares_outstanding double precision not null default 0,
  probability double precision not null default 0.5 check (probability >= 0 and probability <= 1),
  unique (market_id, label)
);

create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  option_id uuid not null references public.market_options (id) on delete cascade,
  shares double precision not null check (shares >= 0),
  avg_price double precision not null check (avg_price >= 0),
  current_value double precision not null default 0,
  realized_pnl int not null default 0,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

create unique index if not exists positions_single_open_idx
  on public.positions (user_id, market_id, option_id)
  where status = 'open';

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  market_id uuid references public.markets (id) on delete set null,
  option_id uuid references public.market_options (id) on delete set null,
  type text not null check (
    type in (
      'buy',
      'sell',
      'payout',
      'refund',
      'signup_bonus',
      'daily_bonus',
      'referral_bonus',
      'house_lead_bonus',
      'fee_contribution',
      'manual_top_up'
    )
  ),
  shares double precision,
  price_per_share double precision,
  points_delta int not null,
  balance_after int not null,
  house_at_tx text references public.houses (id),
  created_at timestamptz not null default now()
);

create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  market_id uuid not null references public.markets (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, market_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0 and char_length(content) <= 800),
  parent_id uuid references public.comments (id) on delete cascade,
  upvote_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.comment_upvotes (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  related_market_id uuid references public.markets (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id) on delete cascade,
  target_type text not null check (target_type in ('market', 'user', 'comment')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open', 'reviewed', 'acted_on', 'dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users (id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  unlocked_at timestamptz not null default now(),
  points_awarded int not null default 0,
  unique (user_id, type)
);

create table if not exists public.probability_snapshots (
  id uuid primary key default gen_random_uuid(),
  market_id uuid not null references public.markets (id) on delete cascade,
  option_id uuid not null references public.market_options (id) on delete cascade,
  probability double precision not null check (probability >= 0 and probability <= 1),
  recorded_at timestamptz not null default now()
);

create table if not exists public.house_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  house_id text not null references public.houses (id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists users_house_idx on public.users (house);
create index if not exists users_status_idx on public.users (status);
create index if not exists markets_status_idx on public.markets (status);
create index if not exists markets_close_time_idx on public.markets (close_time);
create index if not exists markets_featured_idx on public.markets (is_featured);
create index if not exists market_options_market_idx on public.market_options (market_id);
create index if not exists positions_user_idx on public.positions (user_id);
create index if not exists positions_market_idx on public.positions (market_id);
create index if not exists transactions_user_created_idx on public.transactions (user_id, created_at desc);
create index if not exists transactions_market_created_idx on public.transactions (market_id, created_at desc);
create index if not exists transactions_house_payout_idx on public.transactions (house_at_tx) where type = 'payout';
create index if not exists watchlist_user_idx on public.watchlist (user_id);
create index if not exists comments_market_idx on public.comments (market_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);
create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists admin_log_created_idx on public.admin_log (created_at desc);
create index if not exists probability_snapshots_market_time_idx on public.probability_snapshots (market_id, recorded_at desc);
create index if not exists house_events_created_idx on public.house_events (created_at desc);

create or replace function public.validate_comment_depth()
returns trigger
language plpgsql
as $$
declare
  parent_parent_id uuid;
begin
  if new.parent_id is null then
    return new;
  end if;

  select c.parent_id into parent_parent_id
  from public.comments c
  where c.id = new.parent_id;

  if parent_parent_id is not null then
    raise exception 'Only one level of nested replies is allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists comments_validate_depth on public.comments;
create trigger comments_validate_depth
before insert or update of parent_id on public.comments
for each row
execute function public.validate_comment_depth();

create or replace function public.set_house_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists houses_set_updated_at on public.houses;
create trigger houses_set_updated_at
before update on public.houses
for each row
execute function public.set_house_updated_at();

create or replace function public.is_admin_user(target_user_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.users where id = target_user_id and is_admin = true
  );
$$;

create or replace function public.user_status(target_user_id uuid)
returns text
language sql
stable
as $$
  select status from public.users where id = target_user_id;
$$;

create or replace function public.set_tx_house_at_time()
returns trigger
language plpgsql
as $$
begin
  if new.house_at_tx is null and new.type in ('payout', 'house_lead_bonus') then
    select u.house into new.house_at_tx
    from public.users u
    where u.id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_set_house_at_time on public.transactions;
create trigger transactions_set_house_at_time
before insert on public.transactions
for each row
execute function public.set_tx_house_at_time();

create or replace function public.refresh_house_standings()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  old_leader text;
  new_leader text;
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

  if new_leader is not null and old_leader is distinct from new_leader then
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

create or replace function public.on_payout_refresh_houses()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_house_standings();
  return null;
end;
$$;

drop trigger if exists transactions_refresh_houses_after_payout on public.transactions;
create trigger transactions_refresh_houses_after_payout
after insert on public.transactions
for each row
when (new.type = 'payout')
execute function public.on_payout_refresh_houses();

create or replace function public.on_user_membership_change_refresh_houses()
returns trigger
language plpgsql
as $$
begin
  perform public.refresh_house_standings();
  return null;
end;
$$;

drop trigger if exists users_refresh_houses_after_membership_change on public.users;
create trigger users_refresh_houses_after_membership_change
after insert or update of house, status on public.users
for each row
execute function public.on_user_membership_change_refresh_houses();

create or replace function public.log_admin_action(
  p_admin_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_notes text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_log (admin_id, action, target_type, target_id, notes)
  values (p_admin_id, p_action, p_target_type, p_target_id, p_notes);
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

create or replace function public.reject_user(
  p_user_id uuid,
  p_admin_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_user(p_admin_id) then
    raise exception 'Only admins can reject users';
  end if;

  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Rejection reason is required';
  end if;

  insert into public.notifications (
    user_id,
    type,
    title,
    body
  )
  values (
    p_user_id,
    'rejection',
    'Account Rejected',
    p_reason
  );

  perform public.log_admin_action(
    p_admin_id,
    'account_rejected',
    'user',
    p_user_id,
    p_reason
  );

  delete from public.users where id = p_user_id and status = 'pending';
end;
$$;

create or replace function public.lmsr_cost(
  p_q_yes double precision,
  p_q_no double precision,
  p_b double precision
)
returns double precision
language plpgsql
immutable
as $$
declare
  max_q double precision;
begin
  if p_b <= 0 then
    raise exception 'Liquidity parameter must be greater than 0';
  end if;

  max_q := greatest(p_q_yes, p_q_no);
  return p_b * (max_q / p_b + ln(exp((p_q_yes - max_q) / p_b) + exp((p_q_no - max_q) / p_b)));
end;
$$;

create or replace function public.lmsr_cost_to_buy(
  p_q_yes double precision,
  p_q_no double precision,
  p_shares double precision,
  p_b double precision,
  p_is_yes boolean
)
returns double precision
language plpgsql
immutable
as $$
begin
  if p_shares < 0 then
    raise exception 'Shares must be >= 0';
  end if;

  if p_is_yes then
    return public.lmsr_cost(p_q_yes + p_shares, p_q_no, p_b) - public.lmsr_cost(p_q_yes, p_q_no, p_b);
  end if;

  return public.lmsr_cost(p_q_yes, p_q_no + p_shares, p_b) - public.lmsr_cost(p_q_yes, p_q_no, p_b);
end;
$$;

create or replace function public.lmsr_yes_prob(
  p_q_yes double precision,
  p_q_no double precision,
  p_b double precision
)
returns double precision
language sql
immutable
as $$
  select 1 / (1 + exp((p_q_no - p_q_yes) / p_b));
$$;

create or replace function public.place_binary_bet(
  p_market_id uuid,
  p_option_id uuid,
  p_points int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_status text;
  v_user_balance int;
  v_fee_rate double precision;
  v_fee_points int;
  v_net_points int;
  v_b double precision;
  v_market_status text;
  v_close_time timestamptz;
  v_yes_option_id uuid;
  v_no_option_id uuid;
  v_q_yes double precision;
  v_q_no double precision;
  v_is_yes boolean;
  v_lo double precision := 0;
  v_hi double precision;
  v_mid double precision;
  v_shares double precision;
  v_new_q_yes double precision;
  v_new_q_no double precision;
  v_new_yes_prob double precision;
  v_price_per_share double precision;
  v_balance_after int;
  v_position_id uuid;
  v_existing_shares double precision;
  v_existing_avg_price double precision;
  v_has_existing_market_position boolean;
  i int;
begin
  if p_points <= 0 then
    raise exception 'Bet points must be a positive integer';
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select status, points_balance
  into v_user_status, v_user_balance
  from public.users
  where id = v_user_id
  for update;

  if v_user_status is null then
    raise exception 'Profile not found';
  end if;

  if v_user_status != 'active' then
    raise exception 'Only active users can place bets';
  end if;

  if v_user_balance < p_points then
    raise exception 'Insufficient balance';
  end if;

  select status, close_time, fee_rate, liquidity_param
  into v_market_status, v_close_time, v_fee_rate, v_b
  from public.markets
  where id = p_market_id
  for update;

  if v_market_status is null then
    raise exception 'Market not found';
  end if;

  if v_market_status != 'active' then
    raise exception 'Market is not active';
  end if;

  if now() >= v_close_time then
    raise exception 'Market is closed';
  end if;

  select id, shares_outstanding
  into v_yes_option_id, v_q_yes
  from public.market_options
  where market_id = p_market_id and upper(label) = 'YES'
  for update;

  select id, shares_outstanding
  into v_no_option_id, v_q_no
  from public.market_options
  where market_id = p_market_id and upper(label) = 'NO'
  for update;

  if v_yes_option_id is null or v_no_option_id is null then
    raise exception 'Binary market must include YES and NO options';
  end if;

  if p_option_id = v_yes_option_id then
    v_is_yes := true;
  elsif p_option_id = v_no_option_id then
    v_is_yes := false;
  else
    raise exception 'Option does not belong to market binary YES/NO set';
  end if;

  v_fee_points := floor((p_points * v_fee_rate)::numeric);
  v_net_points := p_points - v_fee_points;
  if v_net_points <= 0 then
    raise exception 'Bet amount too small after fee';
  end if;

  v_hi := greatest(v_net_points * 10.0, 1.0);
  while public.lmsr_cost_to_buy(v_q_yes, v_q_no, v_hi, v_b, v_is_yes) < v_net_points loop
    v_hi := v_hi * 2.0;
    if v_hi > 1000000000 then
      exit;
    end if;
  end loop;

  for i in 1..64 loop
    v_mid := (v_lo + v_hi) / 2.0;
    if public.lmsr_cost_to_buy(v_q_yes, v_q_no, v_mid, v_b, v_is_yes) < v_net_points then
      v_lo := v_mid;
    else
      v_hi := v_mid;
    end if;
  end loop;

  v_shares := v_lo;
  if v_shares <= 0 then
    raise exception 'Calculated shares must be positive';
  end if;

  v_price_per_share := v_net_points::double precision / v_shares;
  v_balance_after := v_user_balance - p_points;

  update public.users
  set
    points_balance = v_balance_after,
    total_wagered = total_wagered + p_points
  where id = v_user_id;

  if v_is_yes then
    v_new_q_yes := v_q_yes + v_shares;
    v_new_q_no := v_q_no;
  else
    v_new_q_yes := v_q_yes;
    v_new_q_no := v_q_no + v_shares;
  end if;

  update public.market_options
  set shares_outstanding = v_new_q_yes
  where id = v_yes_option_id;

  update public.market_options
  set shares_outstanding = v_new_q_no
  where id = v_no_option_id;

  v_new_yes_prob := public.lmsr_yes_prob(v_new_q_yes, v_new_q_no, v_b);

  update public.market_options
  set probability = v_new_yes_prob
  where id = v_yes_option_id;

  update public.market_options
  set probability = 1 - v_new_yes_prob
  where id = v_no_option_id;

  select exists (
    select 1
    from public.positions
    where user_id = v_user_id
      and market_id = p_market_id
      and status = 'open'
  )
  into v_has_existing_market_position;

  select id, shares, avg_price
  into v_position_id, v_existing_shares, v_existing_avg_price
  from public.positions
  where user_id = v_user_id
    and market_id = p_market_id
    and option_id = p_option_id
    and status = 'open'
  for update;

  if v_position_id is null then
    insert into public.positions (
      user_id,
      market_id,
      option_id,
      shares,
      avg_price,
      current_value
    )
    values (
      v_user_id,
      p_market_id,
      p_option_id,
      v_shares,
      v_price_per_share,
      case when v_is_yes then v_shares * v_new_yes_prob else v_shares * (1 - v_new_yes_prob) end
    );
  else
    update public.positions
    set
      shares = v_existing_shares + v_shares,
      avg_price = ((v_existing_shares * v_existing_avg_price) + (v_shares * v_price_per_share))
        / nullif(v_existing_shares + v_shares, 0),
      current_value = case
        when v_is_yes
          then (v_existing_shares + v_shares) * v_new_yes_prob
        else (v_existing_shares + v_shares) * (1 - v_new_yes_prob)
      end
    where id = v_position_id;
  end if;

  update public.markets
  set
    total_volume = total_volume + v_net_points,
    fee_pool = fee_pool + v_fee_points,
    trader_count = trader_count + case when v_has_existing_market_position then 0 else 1 end
  where id = p_market_id;

  insert into public.transactions (
    user_id,
    market_id,
    option_id,
    type,
    shares,
    price_per_share,
    points_delta,
    balance_after
  )
  values (
    v_user_id,
    p_market_id,
    p_option_id,
    'buy',
    v_shares,
    v_price_per_share,
    -p_points,
    v_balance_after
  );

  if v_fee_points > 0 then
    insert into public.transactions (
      user_id,
      market_id,
      option_id,
      type,
      points_delta,
      balance_after
    )
    values (
      v_user_id,
      p_market_id,
      p_option_id,
      'fee_contribution',
      0,
      v_balance_after
    );
  end if;

  return jsonb_build_object(
    'shares', v_shares,
    'balance_after', v_balance_after,
    'fee_points', v_fee_points,
    'yes_probability', v_new_yes_prob,
    'no_probability', 1 - v_new_yes_prob
  );
end;
$$;

grant execute on function public.place_binary_bet(uuid, uuid, int) to authenticated;

insert into public.houses (id, display_name, colour_hex, total_points, member_count, rank, previous_rank)
values
  ('lalemant', 'Lalemant', '#111111', 0, 0, 1, 1),
  ('jogues', 'Jogues', '#F1C40F', 0, 0, 2, 2),
  ('lalande', 'Lalande', '#2471A3', 0, 0, 3, 3),
  ('garnier', 'Garnier', '#7F8C8D', 0, 0, 4, 4),
  ('chabanel', 'Chabanel', '#C0392B', 0, 0, 5, 5),
  ('daniel', 'Daniel', '#1E8449', 0, 0, 6, 6)
on conflict (id) do update
set
  display_name = excluded.display_name,
  colour_hex = excluded.colour_hex;

alter table public.users enable row level security;
alter table public.houses enable row level security;
alter table public.markets enable row level security;
alter table public.market_options enable row level security;
alter table public.positions enable row level security;
alter table public.transactions enable row level security;
alter table public.watchlist enable row level security;
alter table public.comments enable row level security;
alter table public.comment_upvotes enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.admin_log enable row level security;
alter table public.achievements enable row level security;
alter table public.probability_snapshots enable row level security;
alter table public.house_events enable row level security;

create policy "users can view own profile"
  on public.users
  for select
  using (auth.uid() = id);

create policy "admins can view all users"
  on public.users
  for select
  using (public.is_admin_user(auth.uid()));

create policy "users can update own editable profile"
  on public.users
  for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and house = (select u.house from public.users u where u.id = auth.uid())
    and username = (select u.username from public.users u where u.id = auth.uid())
  );

create policy "admins can manage users"
  on public.users
  for all
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create policy "houses readable by all authenticated"
  on public.houses
  for select
  to authenticated
  using (true);

create policy "markets readable"
  on public.markets
  for select
  using (true);

create policy "admins manage markets"
  on public.markets
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create policy "market options readable"
  on public.market_options
  for select
  using (true);

create policy "admins manage options"
  on public.market_options
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create policy "active users manage own positions"
  on public.positions
  for all
  to authenticated
  using (
    user_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
  )
  with check (
    user_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
  );

create policy "active users insert own transactions"
  on public.transactions
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
  );

create policy "users view own transactions"
  on public.transactions
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "admins view all transactions"
  on public.transactions
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()));

create policy "users manage own watchlist"
  on public.watchlist
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "active users can post comments"
  on public.comments
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
  );

create policy "comments readable"
  on public.comments
  for select
  using (true);

create policy "users can delete own comments"
  on public.comments
  for delete
  to authenticated
  using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "users manage own comment upvotes"
  on public.comment_upvotes
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "users view own notifications"
  on public.notifications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "users update own notifications"
  on public.notifications
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "active users create reports"
  on public.reports
  for insert
  to authenticated
  with check (
    reporter_id = auth.uid()
    and public.user_status(auth.uid()) = 'active'
  );

create policy "reporter can view own reports"
  on public.reports
  for select
  to authenticated
  using (reporter_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "admins manage reports"
  on public.reports
  for update
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create policy "admins read admin log"
  on public.admin_log
  for select
  to authenticated
  using (public.is_admin_user(auth.uid()));

create policy "admins insert admin log"
  on public.admin_log
  for insert
  to authenticated
  with check (public.is_admin_user(auth.uid()));

create policy "users view own achievements"
  on public.achievements
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin_user(auth.uid()));

create policy "admins manage achievements"
  on public.achievements
  for all
  to authenticated
  using (public.is_admin_user(auth.uid()))
  with check (public.is_admin_user(auth.uid()));

create policy "snapshots readable"
  on public.probability_snapshots
  for select
  using (true);

create policy "admins insert snapshots"
  on public.probability_snapshots
  for insert
  to authenticated
  with check (public.is_admin_user(auth.uid()));

create policy "house events readable"
  on public.house_events
  for select
  to authenticated
  using (true);

comment on table public.transactions is
  'house_at_tx preserves house attribution at payout time so house transfers do not rewrite historical house points.';
