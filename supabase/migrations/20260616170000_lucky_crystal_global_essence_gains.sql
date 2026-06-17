drop function if exists public.activate_inventory_item(text);
drop function if exists public.activate_inventory_item(text, text);
drop function if exists public.claim_achievement(text);

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
  lucky_crystal_count integer := 0;
  lucky_essence_multiplier numeric := 1;
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

    select count(*)
    into lucky_crystal_count
    from public.user_item_activations
    where user_id = current_user_id
      and item_id = 'lucky-crystal'
      and consumed_at is null
      and expires_at is not null
      and expires_at > now();

    lucky_essence_multiplier := 1 + (lucky_crystal_count * 0.1);

    if gamble_success then
      gamble_payout := greatest(round(purchase_cost * (2 + random()))::integer, purchase_cost * 2);
      gamble_payout := greatest(round(gamble_payout * lucky_essence_multiplier)::integer, gamble_payout);

      update public.profiles
      set essence_balance = essence_balance + gamble_payout
      where id = current_user_id;
    end if;

    update public.user_item_activations
    set
      consumed_at = now(),
      metadata = jsonb_build_object(
        'cost_paid', purchase_cost,
        'lucky_crystal_count', lucky_crystal_count,
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

create or replace function public.claim_achievement(target_achievement_id text)
returns public.user_achievements
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  claim_row public.user_achievements%rowtype;
  reward_essence integer := 0;
  reward_item text := null;
  lucky_crystal_count integer := 0;
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
begin
  if current_user_id is null then
    raise exception 'You must be signed in to claim achievements.';
  end if;

  case target_achievement_id
    when 'first-iteration' then
      reward_essence := 100;
      reward_item := 'bonus-challenge-scroll';
    when 'steady-spark' then
      reward_essence := 250;
    when 'forged-discipline' then
      reward_essence := 750;
      reward_item := 'double-xp-sigil';
    when 'hundredfold-path' then
      reward_essence := 1500;
      reward_item := 'streak-shield';
    when 'ember-streak' then
      reward_essence := 100;
    when 'week-flame' then
      reward_essence := 350;
      reward_item := 'focus-lens';
    when 'unbroken-month' then
      reward_essence := 1500;
      reward_item := 'streak-shield';
    when 'rank-d' then
      reward_essence := 150;
    when 'rank-c' then
      reward_essence := 300;
      reward_item := 'double-xp-sigil';
    when 'rank-b' then
      reward_essence := 600;
    when 'rank-a' then
      reward_essence := 1000;
      reward_item := 'double-xp-sigil';
    when 'rank-s' then
      reward_essence := 1500;
      reward_item := 'streak-shield';
    when 'rank-ss' then
      reward_essence := 2500;
      reward_item := 'streak-shield';
    when 'rank-sss' then
      reward_essence := 5000;
      reward_item := 'streak-shield';
    when 'guild-initiate' then
      reward_essence := 200;
      reward_item := 'focus-lens';
    when 'guild-founder' then
      reward_essence := 500;
    when 'boss-breaker' then
      reward_essence := 1000;
      reward_item := 'double-xp-sigil';
    when 'project-forger' then
      reward_essence := 1000;
      reward_item := 'streak-shield';
    when 'armory-initiate' then
      reward_essence := 200;
    when 'rank-arsenal' then
      reward_essence := 500;
      reward_item := 'bonus-challenge-scroll';
    else
      raise exception 'Unknown achievement.';
  end case;

  if not public.is_achievement_unlocked(current_user_id, target_achievement_id) then
    raise exception 'Achievement is not unlocked yet.';
  end if;

  select count(*)
  into lucky_crystal_count
  from public.user_item_activations
  where user_id = current_user_id
    and item_id = 'lucky-crystal'
    and consumed_at is null
    and expires_at is not null
    and expires_at > now();

  if reward_essence > 0 and lucky_crystal_count > 0 then
    reward_essence := greatest(round(reward_essence * (1 + lucky_crystal_count * 0.1))::integer, reward_essence);
  end if;

  insert into public.user_achievements (user_id, achievement_id, essence_reward, reward_item_id)
  values (current_user_id, target_achievement_id, reward_essence, reward_item)
  returning * into claim_row;

  if reward_essence > 0 then
    update public.profiles
    set essence_balance = essence_balance + reward_essence
    where id = current_user_id;
  end if;

  if reward_item is not null then
    insert into public.shop_purchases (user_id, item_id, cost_paid)
    values (current_user_id, reward_item, 0);

    if reward_item = any(prestige_item_ids) then
      insert into public.user_item_activations (user_id, item_id)
      values (current_user_id, reward_item)
      on conflict do nothing;
    end if;
  end if;

  return claim_row;
exception
  when unique_violation then
    raise exception 'Achievement already claimed.';
end;
$$;

revoke all on function public.claim_achievement(text) from public;
grant execute on function public.claim_achievement(text) to authenticated;
