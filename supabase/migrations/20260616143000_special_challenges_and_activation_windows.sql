alter table public.challenges
  add column if not exists is_special boolean not null default false,
  add column if not exists source_item_id text;

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
    'Goblin King''s Gate',
    'Complete five workouts this week to break the fitness boss guarding the gate.',
    650,
    'hard',
    'weekly',
    'Health',
    3,
    null,
    true,
    true,
    'goblin-kings-gate-key'
  ),
  (
    'Deep Work Overlord',
    'Complete ten deep work sessions this week to shatter the focus boss.',
    700,
    'hard',
    'weekly',
    'Focus',
    3,
    null,
    true,
    true,
    'deep-work-gate-key'
  ),
  (
    'Iron Trial March',
    'Walk fifty kilometers this week to conquer the endurance boss.',
    725,
    'hard',
    'weekly',
    'Health',
    3,
    null,
    true,
    true,
    'iron-trial-key'
  ),
  (
    'Trial of Ascension',
    'Finish one high-pressure progression trial this week for a massive breakthrough reward.',
    950,
    'hard',
    'weekly',
    'Growth',
    4,
    null,
    true,
    true,
    'trial-of-ascension'
  ),
  (
    'Legendary Trial',
    'Clear an elite weekly objective worthy of A Rank recognition.',
    1650,
    'hard',
    'weekly',
    'Discipline',
    5,
    null,
    true,
    true,
    'legendary-trial'
  ),
  (
    'Mythic Trial',
    'Survive the hardest solo weekly challenge currently available.',
    2600,
    'hard',
    'weekly',
    'Courage',
    6,
    null,
    true,
    true,
    'mythic-trial'
  ),
  (
    'Master Boss Gauntlet',
    'Defeat an advanced boss encounter for superior rewards this week.',
    1400,
    'hard',
    'weekly',
    'Discipline',
    6,
    null,
    true,
    true,
    'master-boss-key'
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

  insert into public.user_item_activations (user_id, item_id, expires_at)
  values (current_user_id, target_item_id, item_expires_at)
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

revoke all on function public.activate_inventory_item(text) from public;
grant execute on function public.activate_inventory_item(text) to authenticated;
