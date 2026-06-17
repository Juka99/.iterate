alter table public.profiles
  add column if not exists legacy_path text
  check (legacy_path is null or legacy_path in ('Focus', 'Health', 'Growth', 'Discipline', 'Courage'));

insert into public.challenges (
  title,
  description,
  xp_reward,
  difficulty,
  cadence,
  category,
  min_rank_order,
  max_rank_order,
  is_active,
  is_special,
  source_item_id
)
values
  (
    'Legacy Focus: Clarity Rite',
    'Complete one uncompromising deep work session today to honor your Focus legacy.',
    260,
    'medium',
    'daily',
    'Focus',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Focus: Abyss Watch',
    'Finish a high-intensity focus milestone this week to deepen your Focus legacy.',
    1350,
    'hard',
    'weekly',
    'Focus',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Health: Vital Surge',
    'Complete a meaningful health ritual today to strengthen your Health legacy.',
    260,
    'medium',
    'daily',
    'Health',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Health: Iron Renewal',
    'Complete a demanding health milestone this week to advance your Health legacy.',
    1350,
    'hard',
    'weekly',
    'Health',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Growth: Scholar''s Edge',
    'Push one deliberate learning session today to sharpen your Growth legacy.',
    260,
    'medium',
    'daily',
    'Growth',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Growth: Ascendant Study',
    'Reach a major learning breakthrough this week to build your Growth legacy.',
    1350,
    'hard',
    'weekly',
    'Growth',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Discipline: Oath Step',
    'Keep one precise discipline ritual today to reinforce your Discipline legacy.',
    260,
    'medium',
    'daily',
    'Discipline',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Discipline: Unbroken March',
    'Complete a demanding consistency milestone this week to fortify your Discipline legacy.',
    1350,
    'hard',
    'weekly',
    'Discipline',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Courage: Ember Trial',
    'Take one meaningful brave action today to kindle your Courage legacy.',
    260,
    'medium',
    'daily',
    'Courage',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  ),
  (
    'Legacy Courage: Storm Crossing',
    'Finish a high-pressure challenge this week to prove your Courage legacy.',
    1350,
    'hard',
    'weekly',
    'Courage',
    6,
    null,
    true,
    true,
    'hunter-legacy'
  )
on conflict (title) do update
set
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  difficulty = excluded.difficulty,
  cadence = excluded.cadence,
  category = excluded.category,
  min_rank_order = excluded.min_rank_order,
  max_rank_order = excluded.max_rank_order,
  is_active = excluded.is_active,
  is_special = excluded.is_special,
  source_item_id = excluded.source_item_id;

drop function if exists public.activate_inventory_item(text);
drop function if exists public.activate_inventory_item(text, text);

create or replace function public.activate_inventory_item(target_item_id text, target_option text default null)
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
  activation_metadata jsonb := '{}'::jsonb;
  item_expires_at timestamptz := null;
  purchase_cost integer := 0;
  gamble_success boolean := false;
  gamble_payout integer := 0;
  next_daily_reset timestamptz := date_trunc('day', now()) + interval '1 day';
  next_weekly_reset timestamptz := date_trunc('day', now()) + (
    case
      when extract(dow from now()) = 0 then interval '1 day'
      when extract(dow from now()) = 1 then interval '7 day'
      else ((8 - extract(dow from now()))::int || ' day')::interval
    end
  );
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
  daily_window_item_ids text[] := array[
    'bonus-challenge-scroll',
    'challenge-reroll-token',
    'elite-contract',
    'challenge-chain'
  ];
  weekly_window_item_ids text[] := array[
    'goblin-kings-gate-key',
    'deep-work-gate-key',
    'iron-trial-key',
    'trial-of-ascension',
    'legendary-trial',
    'mythic-trial',
    'master-boss-key'
  ];
begin
  if current_user_id is null then
    raise exception 'You must be signed in to activate inventory items.';
  end if;

  if target_item_id = any(prestige_item_ids) then
    raise exception 'Permanent prestige items do not need activation.';
  end if;

  if target_item_id = 'hunters-oath' then
    if target_option is null or target_option not in ('Focus', 'Health', 'Growth', 'Discipline', 'Courage') then
      raise exception 'Hunter''s Oath needs a valid specialization path.';
    end if;

    activation_metadata := jsonb_build_object('category', target_option);
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

  select cost_paid
  into purchase_cost
  from public.shop_purchases
  where user_id = current_user_id
    and item_id = target_item_id
  order by purchased_at asc
  offset activated_count
  limit 1;

  if acquired_count - activated_count <= 0 then
    raise exception 'No available copies of this item remain.';
  end if;

  if target_item_id = any(timed_item_ids) then
    item_expires_at := now() + interval '24 hours';
  elsif target_item_id = any(daily_window_item_ids) then
    item_expires_at := next_daily_reset;
  elsif target_item_id = any(weekly_window_item_ids) then
    item_expires_at := next_weekly_reset;
  elsif target_item_id = 'hunters-oath' then
    item_expires_at := now() + interval '7 days';
  elsif target_item_id = 'essence-gamble' then
    item_expires_at := now();
  end if;

  insert into public.user_item_activations (user_id, item_id, expires_at, metadata)
  values (current_user_id, target_item_id, item_expires_at, activation_metadata)
  returning * into activation_row;

  if target_item_id = 'essence-gamble' then
    gamble_success := random() >= 0.52;

    if gamble_success then
      gamble_payout := greatest(round(purchase_cost * (2 + random()))::integer, purchase_cost * 2);

      update public.profiles
      set essence_balance = essence_balance + gamble_payout
      where id = current_user_id;
    end if;

    update public.user_item_activations
    set
      consumed_at = now(),
      metadata = jsonb_build_object(
        'cost_paid', purchase_cost,
        'payout', gamble_payout,
        'result', case when gamble_success then 'success' else 'failure' end
      )
    where id = activation_row.id
    returning * into activation_row;
  end if;

  return activation_row;
end;
$$;

revoke all on function public.activate_inventory_item(text, text) from public;
grant execute on function public.activate_inventory_item(text, text) to authenticated;

create or replace function public.choose_hunter_legacy_path(target_path text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
begin
  if current_user_id is null then
    raise exception 'You must be signed in to choose a legacy path.';
  end if;

  if target_path not in ('Focus', 'Health', 'Growth', 'Discipline', 'Courage') then
    raise exception 'Legacy path is invalid.';
  end if;

  if not exists (
    select 1
    from public.user_item_activations
    where user_id = current_user_id
      and item_id = 'hunter-legacy'
      and consumed_at is null
  ) then
    raise exception 'Hunter Legacy must be owned before choosing a path.';
  end if;

  select *
  into current_profile
  from public.profiles
  where id = current_user_id;

  if current_profile.legacy_path is not null then
    if current_profile.legacy_path <> target_path then
      raise exception 'Your Hunter Legacy path has already been chosen.';
    end if;

    return current_profile;
  end if;

  update public.profiles
  set legacy_path = target_path
  where id = current_user_id
  returning * into current_profile;

  return current_profile;
end;
$$;

revoke all on function public.choose_hunter_legacy_path(text) from public;
grant execute on function public.choose_hunter_legacy_path(text) to authenticated;
