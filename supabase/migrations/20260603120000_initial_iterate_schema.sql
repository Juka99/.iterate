create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  total_xp integer not null default 0 check (total_xp >= 0),
  essence_balance integer not null default 0 check (essence_balance >= 0),
  current_rank text not null default 'E',
  streak_count integer not null default 0 check (streak_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  xp_reward integer not null check (xp_reward > 0),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  cadence text not null default 'daily' check (cadence in ('daily', 'weekly', 'repeatable')),
  category text not null,
  min_rank_order integer not null default 1 check (min_rank_order >= 1),
  max_rank_order integer check (max_rank_order is null or max_rank_order >= min_rank_order),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.xp_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null,
  source_type text not null,
  source_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  cost_paid integer not null check (cost_paid >= 0),
  purchased_at timestamptz not null default now()
);

create table if not exists public.ranks (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  min_xp integer not null check (min_xp >= 0),
  max_xp integer,
  "order" integer not null unique
);

alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.user_challenges enable row level security;
alter table public.xp_logs enable row level security;
alter table public.shop_purchases enable row level security;
alter table public.ranks enable row level security;

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Authenticated users can read active challenges"
on public.challenges for select
to authenticated
using (is_active = true);

create policy "Users can read own challenge records"
on public.user_challenges for select
using (auth.uid() = user_id);

create policy "Users can insert own challenge records"
on public.user_challenges for insert
with check (auth.uid() = user_id);

create policy "Users can delete own challenge records"
on public.user_challenges for delete
using (auth.uid() = user_id);

create policy "Users can read own XP logs"
on public.xp_logs for select
using (auth.uid() = user_id);

create policy "Users can insert own XP logs"
on public.xp_logs for insert
with check (auth.uid() = user_id);

create policy "Users can delete own XP logs"
on public.xp_logs for delete
using (auth.uid() = user_id);

create policy "Users can read own shop purchases"
on public.shop_purchases for select
using (auth.uid() = user_id);

create policy "Users can insert own shop purchases"
on public.shop_purchases for insert
with check (auth.uid() = user_id);

create policy "Authenticated users can read ranks"
on public.ranks for select
to authenticated
using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.ranks (name, min_xp, max_xp, "order")
values
  ('E', 0, 249, 1),
  ('D', 250, 749, 2),
  ('C', 750, 1499, 3),
  ('B', 1500, 2999, 4),
  ('A', 3000, 4999, 5),
  ('S', 5000, 7999, 6),
  ('SS', 8000, 11999, 7),
  ('SSS', 12000, null, 8)
on conflict (name) do nothing;

insert into public.challenges (title, description, xp_reward, difficulty, cadence, category, min_rank_order, max_rank_order)
values
  ('Ten-minute reset', 'Clear one small space and remove one lingering friction point.', 25, 'easy', 'daily', 'Focus', 1, 2),
  ('Walk the perimeter', 'Take a focused walk and return with one concrete next action.', 35, 'easy', 'daily', 'Health', 1, 2),
  ('Daily calibration', 'Choose one clear target for the day and define the first visible action.', 30, 'easy', 'daily', 'Focus', 1, null),
  ('Momentum review', 'Spend ten focused minutes reviewing progress and choosing the next best move.', 70, 'medium', 'daily', 'Growth', 1, null),
  ('Deliberate hard reset', 'Complete one demanding action that requires real focus but fits your current rank.', 105, 'hard', 'daily', 'Discipline', 1, null),
  ('Deep work gate', 'Complete one uninterrupted 45-minute work block.', 75, 'medium', 'daily', 'Discipline', 1, 3),
  ('Priority lock', 'Choose the single most important outcome for the day and protect the first step.', 90, 'medium', 'daily', 'Focus', 3, 4),
  ('Recovery protocol', 'Complete one intentional recovery action before your energy dips.', 85, 'medium', 'daily', 'Health', 3, 6),
  ('Friction audit', 'Find the biggest blocker in your current routine and remove or reduce it today.', 115, 'hard', 'daily', 'Discipline', 3, 4),
  ('Elite focus sprint', 'Complete a protected 75-minute deep work block with notifications off.', 160, 'hard', 'daily', 'Discipline', 5, 8),
  ('Strategic courage push', 'Take one uncomfortable action that directly moves an important goal forward.', 150, 'hard', 'daily', 'Courage', 5, 6),
  ('Peak recovery check', 'Review sleep, hydration, and movement, then repair the weakest one today.', 135, 'medium', 'daily', 'Health', 7, 8),
  ('Ascendant execution block', 'Complete one high-stakes work block and write the decision it unlocked.', 210, 'hard', 'daily', 'Growth', 7, 8),
  ('Skill rep', 'Practice one skill deliberately and write down what improved.', 60, 'medium', 'weekly', 'Growth', 1, null),
  ('Inbox sweep', 'Clear or triage one cluttered inbox, queue, or capture list.', 45, 'easy', 'weekly', 'Focus', 1, null),
  ('Weekly planning lock', 'Define your top three outcomes for the week and the first action for each.', 55, 'easy', 'weekly', 'Focus', 1, null),
  ('Recovery audit', 'Review your energy patterns and schedule one recovery block before the week gets crowded.', 50, 'easy', 'weekly', 'Health', 1, null),
  ('Environment reset', 'Clean up your workspace, tools, and task list until the next session is frictionless.', 65, 'medium', 'weekly', 'Focus', 1, null),
  ('Courage checkpoint', 'Complete one uncomfortable conversation, request, or decision you have been delaying.', 95, 'hard', 'weekly', 'Courage', 1, null),
  ('Knowledge harvest', 'Summarize one useful lesson from the week and turn it into a reusable note.', 70, 'medium', 'weekly', 'Growth', 1, null),
  ('Health baseline', 'Hit your weekly movement baseline and record what made it easier or harder.', 75, 'medium', 'weekly', 'Health', 1, null),
  ('Discipline ledger', 'Review missed commitments without judgment and choose one rule to tighten.', 80, 'medium', 'weekly', 'Discipline', 1, null),
  ('Focus fortress', 'Create one protected time block for the hardest work of the week.', 85, 'medium', 'weekly', 'Focus', 1, null),
  ('Reflection report', 'Write a short weekly review with one win, one lesson, and one next adjustment.', 60, 'easy', 'weekly', 'Growth', 1, null),
  ('Decision duel', 'Make one important decision you have been circling and write the reason behind it.', 110, 'hard', 'weekly', 'Courage', 1, null),
  ('Boss room', 'Finish the task you have been avoiding and log the result.', 140, 'hard', 'weekly', 'Courage', 2, null),
  ('Systems upgrade', 'Improve one recurring workflow so next week demands less willpower.', 180, 'hard', 'weekly', 'Discipline', 5, null),
  ('Ascendant review', 'Review your week, identify one bottleneck, and define the next high-leverage action.', 320, 'hard', 'weekly', 'Growth', 7, null),
  ('Hydration ping', 'Drink a glass of water and step away from the screen for one minute.', 8, 'easy', 'repeatable', 'Health', 1, null),
  ('Two-minute tidy', 'Remove one tiny source of friction from your workspace.', 10, 'easy', 'repeatable', 'Focus', 1, null),
  ('Micro skill rep', 'Practice one tiny skill repetition and note one thing to improve next time.', 12, 'medium', 'repeatable', 'Growth', 1, null),
  ('Quick courage rep', 'Do one small action you have been postponing for less than five minutes.', 15, 'medium', 'repeatable', 'Courage', 2, null)
on conflict (title) do update
set
  description = excluded.description,
  xp_reward = excluded.xp_reward,
  difficulty = excluded.difficulty,
  cadence = excluded.cadence,
  category = excluded.category,
  min_rank_order = excluded.min_rank_order,
  max_rank_order = excluded.max_rank_order,
  is_active = true;
