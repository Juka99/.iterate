drop function if exists public.get_user_leaderboard(integer);
drop function if exists public.get_guild_leaderboard(integer);
drop function if exists public.get_my_leaderboard_position();
drop function if exists public.get_public_user_detail(uuid);
drop function if exists public.get_public_guild_detail(uuid);
drop function if exists public.get_public_guild_members(uuid, integer);

create or replace function public.get_user_leaderboard(limit_count integer default 50)
returns table (
  leaderboard_position bigint,
  id uuid,
  username text,
  avatar_url text,
  total_xp integer,
  current_rank text,
  streak_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ranked.leaderboard_position,
    ranked.id,
    ranked.username,
    ranked.avatar_url,
    ranked.total_xp,
    ranked.current_rank,
    ranked.streak_count,
    ranked.created_at
  from (
    select
      row_number() over (order by profiles.total_xp desc, profiles.created_at asc, profiles.id asc) as leaderboard_position,
      profiles.id,
      profiles.username,
      profiles.avatar_url,
      profiles.total_xp,
      profiles.current_rank,
      profiles.streak_count,
      profiles.created_at
    from public.profiles
  ) ranked
  where ranked.leaderboard_position <= greatest(1, least(coalesce(limit_count, 50), 50));
$$;

create or replace function public.get_guild_leaderboard(limit_count integer default 50)
returns table (
  leaderboard_position bigint,
  id uuid,
  name text,
  description text,
  emblem_url text,
  level integer,
  total_xp integer,
  member_count bigint,
  member_limit integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with member_counts as (
    select guild_id, count(*) as member_count
    from public.guild_members
    group by guild_id
  )
  select
    ranked.leaderboard_position,
    ranked.id,
    ranked.name,
    ranked.description,
    ranked.emblem_url,
    ranked.level,
    ranked.total_xp,
    ranked.member_count,
    ranked.member_limit,
    ranked.created_at
  from (
    select
      row_number() over (order by guilds.total_xp desc, guilds.created_at asc, guilds.id asc) as leaderboard_position,
      guilds.id,
      guilds.name,
      guilds.description,
      guilds.emblem_url,
      guilds.level,
      guilds.total_xp,
      coalesce(member_counts.member_count, 0) as member_count,
      guilds.member_limit,
      guilds.created_at
    from public.guilds
    left join member_counts on member_counts.guild_id = guilds.id
  ) ranked
  where ranked.leaderboard_position <= greatest(1, least(coalesce(limit_count, 50), 50));
$$;

create or replace function public.get_my_leaderboard_position()
returns table (
  user_position bigint,
  user_total_xp integer,
  guild_position bigint,
  guild_id uuid,
  guild_name text,
  guild_total_xp integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked_profiles as (
    select
      profiles.id,
      profiles.total_xp,
      row_number() over (order by profiles.total_xp desc, profiles.created_at asc, profiles.id asc) as leaderboard_position
    from public.profiles
  ),
  ranked_guilds as (
    select
      guilds.id,
      guilds.name,
      guilds.total_xp,
      row_number() over (order by guilds.total_xp desc, guilds.created_at asc, guilds.id asc) as leaderboard_position
    from public.guilds
  )
  select
    ranked_profiles.leaderboard_position as user_position,
    ranked_profiles.total_xp as user_total_xp,
    ranked_guilds.leaderboard_position as guild_position,
    guilds.id as guild_id,
    guilds.name as guild_name,
    guilds.total_xp as guild_total_xp
  from ranked_profiles
  left join public.guild_members on guild_members.user_id = ranked_profiles.id
  left join public.guilds on guilds.id = guild_members.guild_id
  left join ranked_guilds on ranked_guilds.id = guilds.id
  where ranked_profiles.id = auth.uid();
$$;

create or replace function public.get_public_user_detail(profile_id uuid)
returns table (
  id uuid,
  username text,
  avatar_url text,
  total_xp integer,
  current_rank text,
  streak_count integer,
  created_at timestamptz,
  leaderboard_position bigint,
  guild_id uuid,
  guild_name text,
  guild_role text,
  guild_level integer,
  guild_total_xp integer,
  guild_position bigint,
  guild_joined_at timestamptz,
  guild_total_xp_contributed integer
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked_profiles as (
    select
      profiles.id,
      row_number() over (order by profiles.total_xp desc, profiles.created_at asc, profiles.id asc) as leaderboard_position
    from public.profiles
  ),
  ranked_guilds as (
    select
      guilds.id,
      row_number() over (order by guilds.total_xp desc, guilds.created_at asc, guilds.id asc) as leaderboard_position
    from public.guilds
  )
  select
    profiles.id,
    profiles.username,
    profiles.avatar_url,
    profiles.total_xp,
    profiles.current_rank,
    profiles.streak_count,
    profiles.created_at,
    ranked_profiles.leaderboard_position,
    guilds.id as guild_id,
    guilds.name as guild_name,
    guild_members.role::text as guild_role,
    guilds.level as guild_level,
    guilds.total_xp as guild_total_xp,
    ranked_guilds.leaderboard_position as guild_position,
    guild_members.joined_at as guild_joined_at,
    guild_members.total_xp_contributed as guild_total_xp_contributed
  from public.profiles
  join ranked_profiles on ranked_profiles.id = profiles.id
  left join public.guild_members on guild_members.user_id = profiles.id
  left join public.guilds on guilds.id = guild_members.guild_id
  left join ranked_guilds on ranked_guilds.id = guilds.id
  where profiles.id = profile_id;
$$;

create or replace function public.get_public_guild_detail(target_guild_id uuid)
returns table (
  leaderboard_position bigint,
  id uuid,
  name text,
  description text,
  emblem_url text,
  level integer,
  total_xp integer,
  member_count bigint,
  member_limit integer,
  created_by uuid,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with member_counts as (
    select guild_id, count(*) as member_count
    from public.guild_members
    group by guild_id
  ),
  ranked_guilds as (
    select
      row_number() over (order by guilds.total_xp desc, guilds.created_at asc, guilds.id asc) as leaderboard_position,
      guilds.id,
      guilds.name,
      guilds.description,
      guilds.emblem_url,
      guilds.level,
      guilds.total_xp,
      coalesce(member_counts.member_count, 0) as member_count,
      guilds.member_limit,
      guilds.created_by,
      guilds.created_at
    from public.guilds
    left join member_counts on member_counts.guild_id = guilds.id
  )
  select
    ranked_guilds.leaderboard_position,
    ranked_guilds.id,
    ranked_guilds.name,
    ranked_guilds.description,
    ranked_guilds.emblem_url,
    ranked_guilds.level,
    ranked_guilds.total_xp,
    ranked_guilds.member_count,
    ranked_guilds.member_limit,
    ranked_guilds.created_by,
    ranked_guilds.created_at
  from ranked_guilds
  where ranked_guilds.id = target_guild_id;
$$;

create or replace function public.get_public_guild_members(target_guild_id uuid, limit_count integer default 12)
returns table (
  leaderboard_position bigint,
  user_id uuid,
  username text,
  avatar_url text,
  total_xp integer,
  current_rank text,
  role text,
  joined_at timestamptz,
  weekly_xp_contributed integer,
  total_xp_contributed integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    ranked.leaderboard_position,
    ranked.user_id,
    ranked.username,
    ranked.avatar_url,
    ranked.total_xp,
    ranked.current_rank,
    ranked.role,
    ranked.joined_at,
    ranked.weekly_xp_contributed,
    ranked.total_xp_contributed
  from (
    select
      row_number() over (order by guild_members.total_xp_contributed desc, profiles.total_xp desc, guild_members.joined_at asc) as leaderboard_position,
      guild_members.user_id,
      profiles.username,
      profiles.avatar_url,
      profiles.total_xp,
      profiles.current_rank,
      guild_members.role::text as role,
      guild_members.joined_at,
      guild_members.weekly_xp_contributed,
      guild_members.total_xp_contributed
    from public.guild_members
    join public.profiles on profiles.id = guild_members.user_id
    where guild_members.guild_id = target_guild_id
  ) ranked
  where ranked.leaderboard_position <= greatest(1, least(coalesce(limit_count, 12), 30));
$$;

revoke all on function public.get_user_leaderboard(integer) from public;
revoke all on function public.get_guild_leaderboard(integer) from public;
revoke all on function public.get_my_leaderboard_position() from public;
revoke all on function public.get_public_user_detail(uuid) from public;
revoke all on function public.get_public_guild_detail(uuid) from public;
revoke all on function public.get_public_guild_members(uuid, integer) from public;

grant execute on function public.get_user_leaderboard(integer) to authenticated;
grant execute on function public.get_guild_leaderboard(integer) to authenticated;
grant execute on function public.get_my_leaderboard_position() to authenticated;
grant execute on function public.get_public_user_detail(uuid) to authenticated;
grant execute on function public.get_public_guild_detail(uuid) to authenticated;
grant execute on function public.get_public_guild_members(uuid, integer) to authenticated;
