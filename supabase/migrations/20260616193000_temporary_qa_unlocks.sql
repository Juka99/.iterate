-- Temporary QA override:
-- give all current and newly created users max rank access plus a large Essence balance

delete from public.user_item_activations;

delete from public.shop_purchases;

update public.profiles as profiles
set
  total_xp = 11200,
  essence_balance = greatest(profiles.essence_balance, 1000000),
  current_rank = 'SS';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, total_xp, essence_balance, current_rank)
  values (new.id, split_part(new.email, '@', 1), 11200, 1000000, 'SS')
  on conflict (id) do nothing;

  return new;
end;
$$;
