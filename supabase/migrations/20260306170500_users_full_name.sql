alter table public.users
  add column if not exists full_name text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_full_name_length_check'
  ) then
    alter table public.users
      add constraint users_full_name_length_check
      check (full_name is null or char_length(trim(full_name)) between 2 and 80);
  end if;
end
$$;

comment on column public.users.full_name is
  'Private student full name for admin review and moderation. Public surfaces should render username.';
