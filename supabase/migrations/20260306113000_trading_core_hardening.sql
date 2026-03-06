alter table public.transactions
  add column if not exists client_tx_id uuid;

create unique index if not exists transactions_user_client_tx_unique
  on public.transactions (user_id, client_tx_id)
  where client_tx_id is not null;

update public.houses
set colour_hex = case id
  when 'lalemant' then '#111111'
  when 'jogues' then '#F1C40F'
  when 'lalande' then '#2471A3'
  when 'garnier' then '#7F8C8D'
  when 'chabanel' then '#C0392B'
  when 'daniel' then '#1E8449'
  else colour_hex
end;

create or replace function public.place_binary_bet(
  p_market_id uuid,
  p_option_id uuid,
  p_points int,
  p_client_tx_id uuid default null
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
  v_market_type text;
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
  v_existing_tx record;
  v_recent_bets int;
  i int;
begin
  if p_points <= 0 then
    raise exception 'BET_POINTS_INVALID';
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_client_tx_id is not null then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_client_tx_id::text));

    select id, shares, balance_after, market_id, option_id
    into v_existing_tx
    from public.transactions
    where user_id = v_user_id
      and client_tx_id = p_client_tx_id
      and type = 'buy'
    order by created_at desc
    limit 1;

    if v_existing_tx.id is not null then
      select probability into v_new_yes_prob
      from public.market_options
      where market_id = v_existing_tx.market_id
        and upper(label) = 'YES'
      limit 1;

      return jsonb_build_object(
        'shares', coalesce(v_existing_tx.shares, 0),
        'balance_after', v_existing_tx.balance_after,
        'fee_points', 0,
        'yes_probability', coalesce(v_new_yes_prob, 0.5),
        'no_probability', 1 - coalesce(v_new_yes_prob, 0.5),
        'idempotent', true
      );
    end if;
  end if;

  select status, points_balance
  into v_user_status, v_user_balance
  from public.users
  where id = v_user_id
  for update;

  if v_user_status is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_user_status != 'active' then
    raise exception 'NOT_ACTIVE';
  end if;

  select count(*)::int
  into v_recent_bets
  from public.transactions
  where user_id = v_user_id
    and type = 'buy'
    and created_at >= now() - interval '30 seconds';

  if v_recent_bets >= 5 then
    raise exception 'RATE_LIMITED';
  end if;

  if v_user_balance < p_points then
    raise exception 'INSUFFICIENT_BALANCE';
  end if;

  select status, close_time, fee_rate, liquidity_param, type
  into v_market_status, v_close_time, v_fee_rate, v_b, v_market_type
  from public.markets
  where id = p_market_id
  for update;

  if v_market_status is null then
    raise exception 'MARKET_NOT_FOUND';
  end if;

  if v_market_type != 'binary' then
    raise exception 'MARKET_NOT_BINARY';
  end if;

  if v_market_status != 'active' then
    raise exception 'MARKET_NOT_ACTIVE';
  end if;

  if now() >= v_close_time then
    raise exception 'MARKET_CLOSED';
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
    raise exception 'MARKET_INVALID_OPTIONS';
  end if;

  if p_option_id = v_yes_option_id then
    v_is_yes := true;
  elsif p_option_id = v_no_option_id then
    v_is_yes := false;
  else
    raise exception 'INVALID_OPTION';
  end if;

  v_fee_points := floor((p_points * v_fee_rate)::numeric);
  v_net_points := p_points - v_fee_points;
  if v_net_points <= 0 then
    raise exception 'BET_TOO_SMALL_AFTER_FEE';
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
    raise exception 'CALCULATED_SHARES_INVALID';
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
        when v_is_yes then (v_existing_shares + v_shares) * v_new_yes_prob
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
    balance_after,
    client_tx_id
  )
  values (
    v_user_id,
    p_market_id,
    p_option_id,
    'buy',
    v_shares,
    v_price_per_share,
    -p_points,
    v_balance_after,
    p_client_tx_id
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
    'no_probability', 1 - v_new_yes_prob,
    'idempotent', false
  );
end;
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
begin
  return public.place_binary_bet(p_market_id, p_option_id, p_points, null);
end;
$$;

create or replace function public.place_binary_sell(
  p_market_id uuid,
  p_option_id uuid,
  p_shares double precision,
  p_client_tx_id uuid default null
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
  v_b double precision;
  v_market_status text;
  v_market_type text;
  v_market_close_time timestamptz;
  v_yes_option_id uuid;
  v_no_option_id uuid;
  v_q_yes double precision;
  v_q_no double precision;
  v_is_yes boolean;
  v_new_q_yes double precision;
  v_new_q_no double precision;
  v_new_yes_prob double precision;
  v_position_id uuid;
  v_position_shares double precision;
  v_position_avg_price double precision;
  v_remaining_shares double precision;
  v_gross_value double precision;
  v_points_received int;
  v_balance_after int;
  v_price_per_share double precision;
  v_existing_tx record;
  v_realized_delta int;
  v_cost_basis_sold int;
begin
  if p_shares <= 0 then
    raise exception 'SELL_SHARES_INVALID';
  end if;

  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_client_tx_id is not null then
    perform pg_advisory_xact_lock(hashtext(v_user_id::text || ':' || p_client_tx_id::text));

    select id, points_delta, balance_after
    into v_existing_tx
    from public.transactions
    where user_id = v_user_id
      and client_tx_id = p_client_tx_id
      and type = 'sell'
    order by created_at desc
    limit 1;

    if v_existing_tx.id is not null then
      select probability into v_new_yes_prob
      from public.market_options
      where market_id = p_market_id
        and upper(label) = 'YES'
      limit 1;

      return jsonb_build_object(
        'points_received', coalesce(v_existing_tx.points_delta, 0),
        'balance_after', v_existing_tx.balance_after,
        'yes_probability', coalesce(v_new_yes_prob, 0.5),
        'no_probability', 1 - coalesce(v_new_yes_prob, 0.5),
        'idempotent', true
      );
    end if;
  end if;

  select status, points_balance
  into v_user_status, v_user_balance
  from public.users
  where id = v_user_id
  for update;

  if v_user_status is null then
    raise exception 'PROFILE_NOT_FOUND';
  end if;

  if v_user_status != 'active' then
    raise exception 'NOT_ACTIVE';
  end if;

  select status, type, close_time, liquidity_param
  into v_market_status, v_market_type, v_market_close_time, v_b
  from public.markets
  where id = p_market_id
  for update;

  if v_market_status is null then
    raise exception 'MARKET_NOT_FOUND';
  end if;

  if v_market_type != 'binary' then
    raise exception 'MARKET_NOT_BINARY';
  end if;

  if v_market_status != 'active' then
    raise exception 'MARKET_NOT_ACTIVE';
  end if;

  if now() >= v_market_close_time then
    raise exception 'MARKET_CLOSED';
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
    raise exception 'MARKET_INVALID_OPTIONS';
  end if;

  if p_option_id = v_yes_option_id then
    v_is_yes := true;
  elsif p_option_id = v_no_option_id then
    v_is_yes := false;
  else
    raise exception 'INVALID_OPTION';
  end if;

  select id, shares, avg_price
  into v_position_id, v_position_shares, v_position_avg_price
  from public.positions
  where user_id = v_user_id
    and market_id = p_market_id
    and option_id = p_option_id
    and status = 'open'
  for update;

  if v_position_id is null then
    raise exception 'POSITION_NOT_FOUND';
  end if;

  if p_shares > v_position_shares then
    raise exception 'INSUFFICIENT_SHARES';
  end if;

  if v_is_yes then
    v_gross_value := public.lmsr_cost(v_q_yes, v_q_no, v_b)
      - public.lmsr_cost(v_q_yes - p_shares, v_q_no, v_b);
    v_new_q_yes := v_q_yes - p_shares;
    v_new_q_no := v_q_no;
  else
    v_gross_value := public.lmsr_cost(v_q_yes, v_q_no, v_b)
      - public.lmsr_cost(v_q_yes, v_q_no - p_shares, v_b);
    v_new_q_yes := v_q_yes;
    v_new_q_no := v_q_no - p_shares;
  end if;

  v_points_received := floor(greatest(v_gross_value, 0)::numeric);
  v_balance_after := v_user_balance + v_points_received;
  v_price_per_share := case when p_shares > 0 then v_gross_value / p_shares else 0 end;
  v_cost_basis_sold := floor((p_shares * v_position_avg_price)::numeric);
  v_realized_delta := v_points_received - v_cost_basis_sold;

  update public.users
  set points_balance = v_balance_after
  where id = v_user_id;

  update public.market_options
  set shares_outstanding = v_new_q_yes
  where id = v_yes_option_id;

  update public.market_options
  set shares_outstanding = v_new_q_no
  where id = v_no_option_id;

  v_new_yes_prob := public.lmsr_yes_prob(
    v_new_q_yes,
    v_new_q_no,
    v_b
  );

  update public.market_options
  set probability = v_new_yes_prob
  where id = v_yes_option_id;

  update public.market_options
  set probability = 1 - v_new_yes_prob
  where id = v_no_option_id;

  v_remaining_shares := v_position_shares - p_shares;

  if v_remaining_shares <= 0.0000001 then
    update public.positions
    set
      shares = 0,
      status = 'closed',
      closed_at = now(),
      current_value = 0,
      realized_pnl = realized_pnl + v_realized_delta
    where id = v_position_id;
  else
    update public.positions
    set
      shares = v_remaining_shares,
      current_value = case when v_is_yes then v_remaining_shares * v_new_yes_prob else v_remaining_shares * (1 - v_new_yes_prob) end,
      realized_pnl = realized_pnl + v_realized_delta
    where id = v_position_id;
  end if;

  update public.markets
  set total_volume = total_volume + v_points_received
  where id = p_market_id;

  insert into public.transactions (
    user_id,
    market_id,
    option_id,
    type,
    shares,
    price_per_share,
    points_delta,
    balance_after,
    client_tx_id
  )
  values (
    v_user_id,
    p_market_id,
    p_option_id,
    'sell',
    p_shares,
    v_price_per_share,
    v_points_received,
    v_balance_after,
    p_client_tx_id
  );

  return jsonb_build_object(
    'points_received', v_points_received,
    'balance_after', v_balance_after,
    'yes_probability', v_new_yes_prob,
    'no_probability', 1 - v_new_yes_prob,
    'idempotent', false
  );
end;
$$;

create or replace function public.preview_market_resolution(
  p_market_id uuid,
  p_winning_option_id uuid
)
returns table (
  user_id uuid,
  username text,
  option_id uuid,
  shares double precision,
  payout int,
  cost_basis int,
  realized_pnl int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request_user uuid;
  v_market_type text;
  v_is_admin boolean;
begin
  v_request_user := auth.uid();
  if v_request_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  v_is_admin := public.is_admin_user(v_request_user);
  if not v_is_admin then
    raise exception 'NOT_ADMIN';
  end if;

  select type into v_market_type
  from public.markets
  where id = p_market_id;

  if v_market_type is null then
    raise exception 'MARKET_NOT_FOUND';
  end if;

  if v_market_type != 'binary' then
    raise exception 'MARKET_NOT_BINARY';
  end if;

  return query
  select
    p.user_id,
    u.username,
    p.option_id,
    p.shares,
    case when p.option_id = p_winning_option_id then floor(p.shares::numeric)::int else 0 end as payout,
    floor((p.shares * p.avg_price)::numeric)::int as cost_basis,
    (case when p.option_id = p_winning_option_id then floor(p.shares::numeric)::int else 0 end)
      - floor((p.shares * p.avg_price)::numeric)::int as realized_pnl
  from public.positions p
  join public.users u on u.id = p.user_id
  where p.market_id = p_market_id
    and p.status = 'open';
end;
$$;

create or replace function public.resolve_binary_market(
  p_market_id uuid,
  p_winning_option_id uuid,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_market record;
  v_winning_label text;
  v_yes_option_id uuid;
  v_no_option_id uuid;
  v_user_balance_after int;
  v_payout int;
  v_cost_basis int;
  v_realized int;
  v_total_payout int := 0;
  v_total_positions int := 0;
  v_total_winners int := 0;
  rec record;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  select *
  into v_market
  from public.markets
  where id = p_market_id
  for update;

  if v_market.id is null then
    raise exception 'MARKET_NOT_FOUND';
  end if;

  if v_market.type != 'binary' then
    raise exception 'MARKET_NOT_BINARY';
  end if;

  if v_market.status in ('resolved', 'cancelled') then
    raise exception 'MARKET_ALREADY_FINALIZED';
  end if;

  select id into v_yes_option_id
  from public.market_options
  where market_id = p_market_id and upper(label) = 'YES'
  for update;

  select id into v_no_option_id
  from public.market_options
  where market_id = p_market_id and upper(label) = 'NO'
  for update;

  if p_winning_option_id not in (v_yes_option_id, v_no_option_id) then
    raise exception 'INVALID_OPTION';
  end if;

  select label into v_winning_label
  from public.market_options
  where id = p_winning_option_id;

  for rec in
    select *
    from public.positions
    where market_id = p_market_id
      and status = 'open'
    for update
  loop
    v_total_positions := v_total_positions + 1;
    v_cost_basis := floor((rec.shares * rec.avg_price)::numeric)::int;
    v_payout := case when rec.option_id = p_winning_option_id then floor(rec.shares::numeric)::int else 0 end;
    v_realized := v_payout - v_cost_basis;

    update public.users
    set
      points_balance = points_balance + v_payout,
      lifetime_won = lifetime_won + case when v_payout > 0 then v_payout else 0 end,
      biggest_win = greatest(biggest_win, case when v_payout > 0 then v_payout else 0 end),
      win_count = win_count + case when v_realized > 0 then 1 else 0 end,
      loss_count = loss_count + case when v_realized < 0 then 1 else 0 end
    where id = rec.user_id
    returning points_balance into v_user_balance_after;

    update public.positions
    set
      status = 'closed',
      closed_at = now(),
      current_value = v_payout,
      realized_pnl = rec.realized_pnl + v_realized
    where id = rec.id;

    if v_payout > 0 then
      v_total_winners := v_total_winners + 1;
      v_total_payout := v_total_payout + v_payout;

      insert into public.transactions (
        user_id,
        market_id,
        option_id,
        type,
        shares,
        points_delta,
        balance_after
      )
      values (
        rec.user_id,
        p_market_id,
        rec.option_id,
        'payout',
        rec.shares,
        v_payout,
        v_user_balance_after
      );
    end if;
  end loop;

  update public.markets
  set
    status = 'resolved',
    resolved_at = now(),
    resolution_value = p_winning_option_id::text
  where id = p_market_id;

  update public.market_options
  set probability = case when id = p_winning_option_id then 1 else 0 end
  where market_id = p_market_id;

  perform public.log_admin_action(
    p_admin_id,
    'market_resolved',
    'market',
    p_market_id,
    format('Resolved to %s (%s). Total payout: %s', p_winning_option_id::text, v_winning_label, v_total_payout::text)
  );

  return jsonb_build_object(
    'market_id', p_market_id,
    'winning_option_id', p_winning_option_id,
    'winning_label', v_winning_label,
    'total_positions', v_total_positions,
    'total_winners', v_total_winners,
    'total_payout', v_total_payout
  );
end;
$$;

create or replace function public.cancel_market(
  p_market_id uuid,
  p_admin_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_market record;
  rec record;
  v_refund int;
  v_total_refund int := 0;
  v_refunded_positions int := 0;
  v_balance_after int;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  select *
  into v_market
  from public.markets
  where id = p_market_id
  for update;

  if v_market.id is null then
    raise exception 'MARKET_NOT_FOUND';
  end if;

  if v_market.status in ('resolved', 'cancelled') then
    raise exception 'MARKET_ALREADY_FINALIZED';
  end if;

  for rec in
    select *
    from public.positions
    where market_id = p_market_id
      and status = 'open'
    for update
  loop
    v_refund := floor((rec.shares * rec.avg_price)::numeric)::int;
    v_total_refund := v_total_refund + v_refund;
    v_refunded_positions := v_refunded_positions + 1;

    update public.users
    set points_balance = points_balance + v_refund
    where id = rec.user_id
    returning points_balance into v_balance_after;

    update public.positions
    set
      status = 'closed',
      closed_at = now(),
      current_value = v_refund
    where id = rec.id;

    if v_refund > 0 then
      insert into public.transactions (
        user_id,
        market_id,
        option_id,
        type,
        shares,
        points_delta,
        balance_after
      )
      values (
        rec.user_id,
        p_market_id,
        rec.option_id,
        'refund',
        rec.shares,
        v_refund,
        v_balance_after
      );
    end if;
  end loop;

  update public.markets
  set
    status = 'cancelled',
    resolved_at = now(),
    resolution_value = null
  where id = p_market_id;

  perform public.log_admin_action(
    p_admin_id,
    'market_cancelled',
    'market',
    p_market_id,
    coalesce(nullif(trim(p_reason), ''), 'Cancelled without reason')
  );

  return jsonb_build_object(
    'market_id', p_market_id,
    'refunded_positions', v_refunded_positions,
    'total_refund', v_total_refund
  );
end;
$$;

grant execute on function public.place_binary_bet(uuid, uuid, int, uuid) to authenticated;
grant execute on function public.place_binary_bet(uuid, uuid, int) to authenticated;
grant execute on function public.place_binary_sell(uuid, uuid, double precision, uuid) to authenticated;
grant execute on function public.preview_market_resolution(uuid, uuid) to authenticated;
grant execute on function public.resolve_binary_market(uuid, uuid, uuid) to authenticated;
grant execute on function public.cancel_market(uuid, uuid, text) to authenticated;

create policy "users insert own pending profile"
  on public.users
  for insert
  to authenticated
  with check (
    id = auth.uid()
    and status = 'pending'
    and house_confirmed = false
    and points_balance = 0
    and is_admin = false
  );

create policy "pending users update own profile"
  on public.users
  for update
  to authenticated
  using (
    id = auth.uid()
    and status = 'pending'
  )
  with check (
    id = auth.uid()
    and status = 'pending'
    and house_confirmed = false
    and points_balance = 0
    and is_admin = false
  );

create policy "authenticated can view active user rows"
  on public.users
  for select
  to authenticated
  using (status = 'active');

create policy "authenticated can read market activity transactions"
  on public.transactions
  for select
  to authenticated
  using (type in ('buy', 'sell'));
