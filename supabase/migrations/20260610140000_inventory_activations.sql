create table if not exists public.user_item_activations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  activated_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.user_item_activations enable row level security;

drop policy if exists "Users can read own item activations" on public.user_item_activations;
create policy "Users can read own item activations"
on public.user_item_activations for select
using (auth.uid() = user_id);

drop function if exists public.activate_inventory_item(text);

create or replace function public.activate_inventory_item(target_item_id text)
returns public.user_item_activations
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  acquired_count integer := 0;
  activated_count integer := 0;
  activation_row public.user_item_activations%rowtype;
  item_expires_at timestamptz := null;
  prestige_item_ids text[] := array[
    'hunter-legacy',
    'paragon-aura',
    'paragon-nameplate',
    'crystal-banner',
    'rank-showcase-pedestal',
    'iterated-aura',
    'cosmic-hunter-frame',
    'living-nameplate',
    'hall-of-legends-monument',
    'founders-relic'
  ];
  timed_item_ids text[] := array[
    'focus-lens',
    'iron-will-token',
    'scholars-seal',
    'lucky-crystal'
  ];
begin
  if current_user_id is null then
    raise exception 'You must be signed in to activate inventory items.';
  end if;

  if target_item_id = any(prestige_item_ids) then
    raise exception 'Permanent prestige items do not need activation.';
  end if;

  select count(*)
  into acquired_count
  from public.shop_purchases
  where user_id = current_user_id
    and item_id = target_item_id;

  select count(*)
  into activated_count
  from public.user_item_activations
  where user_id = current_user_id
    and item_id = target_item_id;

  if acquired_count - activated_count <= 0 then
    raise exception 'No available copies of this item remain.';
  end if;

  if target_item_id = any(timed_item_ids) then
    item_expires_at := now() + interval '24 hours';
  end if;

  insert into public.user_item_activations (user_id, item_id, expires_at)
  values (current_user_id, target_item_id, item_expires_at)
  returning * into activation_row;

  return activation_row;
end;
$$;

revoke all on function public.activate_inventory_item(text) from public;
grant execute on function public.activate_inventory_item(text) to authenticated;
