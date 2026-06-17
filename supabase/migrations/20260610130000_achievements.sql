create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null,
  essence_reward integer not null default 0 check (essence_reward >= 0),
  reward_item_id text,
  claimed_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists "Users can read own achievements" on public.user_achievements;
create policy "Users can read own achievements"
on public.user_achievements for select
using (auth.uid() = user_id);

drop function if exists public.is_achievement_unlocked(uuid, text);
drop function if exists public.get_unlocked_achievement_ids();
drop function if exists public.claim_achievement(text);

create or replace function public.is_achievement_unlocked(target_user_id uuid, target_achievement_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  completed_count integer := 0;
  profile_xp integer := 0;
  profile_streak integer := 0;
  core_item_ids text[] := array[
    'bonus-challenge-scroll',
    'double-xp-sigil',
    'focus-lens',
    'iron-will-token',
    'scholars-seal',
    'streak-shield'
  ];
  ranked_item_ids text[] := array[
    'elite-contract',
    'challenge-reroll-token',
    'lucky-crystal',
    'momentum-crystal',
    'goblin-kings-gate-key',
    'deep-work-gate-key',
    'iron-trial-key',
    'challenge-chain',
    'trial-of-ascension',
    'hunters-oath',
    'essence-gamble',
    'legendary-trial',
    'legendary-contract',
    'mythic-trial',
    'hunter-legacy',
    'master-boss-key',
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
  if target_user_id is null then
    return false;
  end if;

  select coalesce(total_xp, 0), coalesce(streak_count, 0)
  into profile_xp, profile_streak
  from public.profiles
  where id = target_user_id;

  select count(*)
  into completed_count
  from public.user_challenges
  where user_id = target_user_id
    and status = 'completed';

  case target_achievement_id
    when 'first-iteration' then
      return completed_count >= 1;
    when 'steady-spark' then
      return completed_count >= 10;
    when 'forged-discipline' then
      return completed_count >= 50;
    when 'hundredfold-path' then
      return completed_count >= 100;
    when 'ember-streak' then
      return profile_streak >= 3;
    when 'week-flame' then
      return profile_streak >= 7;
    when 'unbroken-month' then
      return profile_streak >= 30;
    when 'rank-d' then
      return profile_xp >= 250;
    when 'rank-c' then
      return profile_xp >= 750;
    when 'rank-b' then
      return profile_xp >= 1500;
    when 'rank-a' then
      return profile_xp >= 3000;
    when 'rank-s' then
      return profile_xp >= 5000;
    when 'rank-ss' then
      return profile_xp >= 8000;
    when 'rank-sss' then
      return profile_xp >= 12000;
    when 'guild-initiate' then
      return exists (
        select 1
        from public.guild_members
        where user_id = target_user_id
      );
    when 'guild-founder' then
      return exists (
        select 1
        from public.guilds
        where created_by = target_user_id
      );
    when 'boss-breaker' then
      return exists (
        select 1
        from public.guild_boss_contributions
        join public.guild_bosses on guild_bosses.id = guild_boss_contributions.boss_id
        where guild_boss_contributions.user_id = target_user_id
          and guild_bosses.status = 'defeated'
      );
    when 'project-forger' then
      return exists (
        select 1
        from public.guild_members
        join public.guild_projects on guild_projects.guild_id = guild_members.guild_id
        where guild_members.user_id = target_user_id
          and guild_projects.status = 'completed'
      );
    when 'armory-initiate' then
      return exists (
        select 1
        from public.shop_purchases
        where user_id = target_user_id
          and item_id = any(core_item_ids)
      );
    when 'rank-arsenal' then
      return exists (
        select 1
        from public.shop_purchases
        where user_id = target_user_id
          and item_id = any(ranked_item_ids)
      );
    else
      return false;
  end case;
end;
$$;

create or replace function public.get_unlocked_achievement_ids()
returns table (achievement_id text)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  return query
  select achievement_list.achievement_id
  from unnest(array[
    'first-iteration',
    'steady-spark',
    'forged-discipline',
    'hundredfold-path',
    'ember-streak',
    'week-flame',
    'unbroken-month',
    'rank-d',
    'rank-c',
    'rank-b',
    'rank-a',
    'rank-s',
    'rank-ss',
    'rank-sss',
    'guild-initiate',
    'guild-founder',
    'boss-breaker',
    'project-forger',
    'armory-initiate',
    'rank-arsenal'
  ]::text[]) as achievement_list(achievement_id)
  where public.is_achievement_unlocked(auth.uid(), achievement_list.achievement_id);
end;
$$;

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
  end if;

  return claim_row;
exception
  when unique_violation then
    raise exception 'Achievement already claimed.';
end;
$$;

revoke all on function public.is_achievement_unlocked(uuid, text) from public;
revoke all on function public.get_unlocked_achievement_ids() from public;
revoke all on function public.claim_achievement(text) from public;

grant execute on function public.get_unlocked_achievement_ids() to authenticated;
grant execute on function public.claim_achievement(text) to authenticated;
