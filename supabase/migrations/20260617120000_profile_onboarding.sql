alter table public.profiles
add column if not exists onboarding_completed boolean;

update public.profiles
set onboarding_completed = username is not null and btrim(username) <> ''
where onboarding_completed is null;

alter table public.profiles
alter column onboarding_completed set default false,
alter column onboarding_completed set not null;

alter table public.profiles
drop constraint if exists profiles_username_length_check;

alter table public.profiles
add constraint profiles_username_length_check
check (username is null or char_length(btrim(username)) between 2 and 17)
not valid;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, onboarding_completed)
  values (new.id, null, false)
  on conflict (id) do nothing;

  return new;
end;
$$;
