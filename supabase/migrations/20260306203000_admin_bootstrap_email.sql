create or replace function public.auto_promote_reserved_admin_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.email, '')) = 'dimarin001@tcdsb.ca' then
    update public.users
    set
      is_admin = true,
      status = 'active',
      house_confirmed = true,
      approved_at = coalesce(approved_at, now()),
      approved_by = coalesce(approved_by, new.id),
      points_balance = greatest(points_balance, 100)
    where id = new.id;

    insert into public.transactions (user_id, type, points_delta, balance_after, house_at_tx)
    select
      u.id,
      'signup_bonus',
      100,
      u.points_balance,
      u.house
    from public.users u
    where u.id = new.id
      and not exists (
        select 1
        from public.transactions t
        where t.user_id = u.id
          and t.type = 'signup_bonus'
      );
  end if;

  return new;
end;
$$;

drop trigger if exists users_auto_promote_reserved_admin on public.users;

create trigger users_auto_promote_reserved_admin
after insert or update of email on public.users
for each row
execute function public.auto_promote_reserved_admin_email();

-- Backfill immediately if the reserved admin profile row already exists.
do $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id
  from public.users
  where lower(email) = 'dimarin001@tcdsb.ca'
  limit 1;

  if v_admin_id is not null then
    update public.users
    set
      is_admin = true,
      status = 'active',
      house_confirmed = true,
      approved_at = coalesce(approved_at, now()),
      approved_by = coalesce(approved_by, v_admin_id),
      points_balance = greatest(points_balance, 100)
    where id = v_admin_id;

    insert into public.transactions (user_id, type, points_delta, balance_after, house_at_tx)
    select
      u.id,
      'signup_bonus',
      100,
      u.points_balance,
      u.house
    from public.users u
    where u.id = v_admin_id
      and not exists (
        select 1
        from public.transactions t
        where t.user_id = u.id
          and t.type = 'signup_bonus'
      );
  end if;
end
$$;
