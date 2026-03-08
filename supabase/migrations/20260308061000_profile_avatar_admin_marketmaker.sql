alter table public.users
  add column if not exists profile_completed_at timestamptz;

create index if not exists users_profile_completed_idx
  on public.users (profile_completed_at);

comment on column public.users.profile_completed_at is
  'Timestamp set when the student finishes the one-time profile setup quiz.';

create or replace function public.complete_profile_setup(
  p_full_name text,
  p_username text,
  p_house text,
  p_grade_year int,
  p_favourite_subject text default null,
  p_bio text default null,
  p_avatar_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_existing record;
  v_username text;
  v_profile_completed_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  v_username := lower(trim(coalesce(p_username, '')));
  if v_username !~ '^[a-z0-9_]{3,24}$' then
    raise exception 'USERNAME_INVALID';
  end if;

  if p_house not in ('lalemant', 'jogues', 'lalande', 'garnier', 'chabanel', 'daniel') then
    raise exception 'HOUSE_INVALID';
  end if;

  if p_grade_year is null or p_grade_year < 9 or p_grade_year > 12 then
    raise exception 'GRADE_INVALID';
  end if;

  if char_length(trim(coalesce(p_full_name, ''))) < 2 or char_length(trim(coalesce(p_full_name, ''))) > 80 then
    raise exception 'FULL_NAME_INVALID';
  end if;

  if char_length(coalesce(p_bio, '')) > 160 then
    raise exception 'BIO_TOO_LONG';
  end if;

  select id, email, username, status, profile_completed_at
  into v_existing
  from public.users
  where id = v_user_id
  for update;

  if v_existing.id is not null and v_existing.profile_completed_at is not null then
    return jsonb_build_object(
      'already_completed', true,
      'username', v_existing.username,
      'profile_completed_at', v_existing.profile_completed_at
    );
  end if;

  select email into v_email from auth.users where id = v_user_id;
  if v_email is null then
    raise exception 'AUTH_EMAIL_MISSING';
  end if;

  insert into public.users (
    id,
    email,
    full_name,
    username,
    house,
    house_confirmed,
    grade_year,
    favourite_subject,
    bio,
    avatar_url,
    status,
    points_balance,
    is_admin,
    profile_completed_at
  )
  values (
    v_user_id,
    v_email,
    trim(p_full_name),
    v_username,
    p_house,
    false,
    p_grade_year,
    nullif(trim(coalesce(p_favourite_subject, '')), ''),
    nullif(trim(coalesce(p_bio, '')), ''),
    nullif(trim(coalesce(p_avatar_url, '')), ''),
    'pending',
    0,
    false,
    now()
  )
  on conflict (id)
  do update set
    full_name = excluded.full_name,
    username = excluded.username,
    house = excluded.house,
    house_confirmed = false,
    grade_year = excluded.grade_year,
    favourite_subject = excluded.favourite_subject,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url,
    status = case when public.users.status = 'banned' then 'banned' else 'pending' end,
    points_balance = case when public.users.status = 'banned' then public.users.points_balance else 0 end,
    is_admin = coalesce(public.users.is_admin, false),
    profile_completed_at = coalesce(public.users.profile_completed_at, now());

  select username, profile_completed_at
  into v_username, v_profile_completed_at
  from public.users
  where id = v_user_id;

  return jsonb_build_object(
    'already_completed', false,
    'username', v_username,
    'profile_completed_at', v_profile_completed_at
  );
end;
$$;

grant execute on function public.complete_profile_setup(text, text, text, int, text, text, text) to authenticated;
grant execute on function public.approve_user(uuid, uuid, text) to authenticated;
grant execute on function public.reject_user(uuid, uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars users upload own" on storage.objects;
create policy "avatars users upload own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars users update own" on storage.objects;
create policy "avatars users update own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "avatars users delete own" on storage.objects;
create policy "avatars users delete own"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and split_part(name, '/', 1) = auth.uid()::text
);

create or replace function public.admin_override_house(
  p_user_id uuid,
  p_new_house text,
  p_admin_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_old_house text;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  if p_new_house not in ('lalemant', 'jogues', 'lalande', 'garnier', 'chabanel', 'daniel') then
    raise exception 'HOUSE_INVALID';
  end if;

  select house into v_old_house
  from public.users
  where id = p_user_id
  for update;

  if v_old_house is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  update public.users
  set house = p_new_house
  where id = p_user_id;

  insert into public.admin_log (admin_id, action, target_type, target_id, notes)
  values (
    p_admin_id,
    'house_overridden',
    'user',
    p_user_id,
    concat('from=', v_old_house, '; to=', p_new_house, case when p_notes is null then '' else '; note=' || p_notes end)
  );

  return jsonb_build_object('ok', true, 'old_house', v_old_house, 'new_house', p_new_house);
end;
$$;

create or replace function public.admin_set_user_ban(
  p_user_id uuid,
  p_banned boolean,
  p_reason text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_new_status text;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  v_new_status := case when p_banned then 'banned' else 'active' end;

  update public.users
  set status = v_new_status
  where id = p_user_id;

  if not found then
    raise exception 'USER_NOT_FOUND';
  end if;

  insert into public.admin_log (admin_id, action, target_type, target_id, notes)
  values (
    p_admin_id,
    case when p_banned then 'user_banned' else 'user_unbanned' end,
    'user',
    p_user_id,
    coalesce(nullif(trim(p_reason), ''), case when p_banned then 'Banned by admin' else 'Unbanned by admin' end)
  );

  return jsonb_build_object('ok', true, 'status', v_new_status);
end;
$$;

create or replace function public.admin_add_points(
  p_user_id uuid,
  p_points int,
  p_reason text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_balance int;
  v_new_balance int;
  v_house text;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  if p_points <= 0 then
    raise exception 'POINTS_INVALID';
  end if;

  select points_balance, house
  into v_balance, v_house
  from public.users
  where id = p_user_id
  for update;

  if v_balance is null then
    raise exception 'USER_NOT_FOUND';
  end if;

  v_new_balance := v_balance + p_points;

  update public.users
  set points_balance = v_new_balance
  where id = p_user_id;

  insert into public.transactions (user_id, type, points_delta, balance_after, house_at_tx)
  values (p_user_id, 'manual_top_up', p_points, v_new_balance, v_house);

  insert into public.admin_log (admin_id, action, target_type, target_id, notes)
  values (
    p_admin_id,
    'points_adjusted',
    'user',
    p_user_id,
    concat('points=', p_points::text, '; reason=', coalesce(nullif(trim(p_reason), ''), 'manual top up'))
  );

  return jsonb_build_object('ok', true, 'balance_after', v_new_balance);
end;
$$;

create or replace function public.admin_create_market(
  p_title text,
  p_description text,
  p_category text,
  p_type text,
  p_close_time timestamptz,
  p_resolution_criteria text,
  p_liquidity_param double precision,
  p_is_featured boolean,
  p_options text[] default null,
  p_admin_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user uuid;
  v_market_id uuid;
  v_type text;
  v_labels text[];
  v_label text;
  v_probability double precision;
  v_count int;
begin
  v_auth_user := auth.uid();
  if v_auth_user is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if p_admin_id is null then
    p_admin_id := v_auth_user;
  end if;

  if p_admin_id != v_auth_user or not public.is_admin_user(v_auth_user) then
    raise exception 'NOT_ADMIN';
  end if;

  if p_category not in ('Sports', 'Campus', 'Pop Culture', 'Academic', 'Other') then
    raise exception 'CATEGORY_INVALID';
  end if;

  v_type := lower(trim(coalesce(p_type, 'binary')));
  if v_type not in ('binary', 'multi') then
    raise exception 'TYPE_INVALID';
  end if;

  if p_close_time is null or p_close_time <= now() then
    raise exception 'CLOSE_TIME_INVALID';
  end if;

  if char_length(trim(coalesce(p_title, ''))) < 8 then
    raise exception 'TITLE_TOO_SHORT';
  end if;

  if char_length(trim(coalesce(p_description, ''))) < 20 then
    raise exception 'DESCRIPTION_TOO_SHORT';
  end if;

  if char_length(trim(coalesce(p_resolution_criteria, ''))) < 100 then
    raise exception 'RESOLUTION_CRITERIA_TOO_SHORT';
  end if;

  if p_liquidity_param is null or p_liquidity_param <= 0 then
    p_liquidity_param := 100;
  end if;

  if v_type = 'binary' then
    v_labels := array['YES', 'NO'];
  else
    select array_agg(distinct normalized.label order by normalized.label)
    into v_labels
    from (
      select trim(unnest(coalesce(p_options, '{}'))) as label
    ) as normalized
    where char_length(normalized.label) > 0;

    v_count := coalesce(array_length(v_labels, 1), 0);
    if v_count < 2 or v_count > 8 then
      raise exception 'MULTI_OPTIONS_INVALID';
    end if;
  end if;

  insert into public.markets (
    title,
    description,
    category,
    type,
    status,
    is_featured,
    close_time,
    liquidity_param,
    resolution_criteria,
    created_by
  )
  values (
    trim(p_title),
    trim(p_description),
    p_category,
    v_type,
    'active',
    coalesce(p_is_featured, false),
    p_close_time,
    p_liquidity_param,
    trim(p_resolution_criteria),
    p_admin_id
  )
  returning id into v_market_id;

  v_count := coalesce(array_length(v_labels, 1), 0);
  v_probability := case when v_type = 'binary' then 0.5 else 1.0 / greatest(v_count, 1) end;

  foreach v_label in array v_labels
  loop
    insert into public.market_options (market_id, label, shares_outstanding, probability)
    values (v_market_id, v_label, 0, v_probability);
  end loop;

  insert into public.admin_log (admin_id, action, target_type, target_id, notes)
  values (
    p_admin_id,
    'market_created',
    'market',
    v_market_id,
    concat('type=', v_type, '; options=', v_count::text)
  );

  return jsonb_build_object(
    'ok', true,
    'market_id', v_market_id,
    'type', v_type,
    'options_count', v_count
  );
end;
$$;

grant execute on function public.admin_override_house(uuid, text, uuid, text) to authenticated;
grant execute on function public.admin_set_user_ban(uuid, boolean, text, uuid) to authenticated;
grant execute on function public.admin_add_points(uuid, int, text, uuid) to authenticated;
grant execute on function public.admin_create_market(text, text, text, text, timestamptz, text, double precision, boolean, text[], uuid) to authenticated;
