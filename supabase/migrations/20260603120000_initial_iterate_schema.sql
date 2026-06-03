create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_rank text not null default 'E',
  streak_count integer not null default 0 check (streak_count >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  xp_reward integer not null check (xp_reward > 0),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  category text not null,
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

create policy "Users can read own XP logs"
on public.xp_logs for select
using (auth.uid() = user_id);

create policy "Users can insert own XP logs"
on public.xp_logs for insert
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
  ('S', 5000, null, 6)
on conflict (name) do nothing;

insert into public.challenges (title, description, xp_reward, difficulty, category)
values
  ('Ten-minute reset', 'Clear one small space and remove one lingering friction point.', 25, 'easy', 'Focus'),
  ('Walk the perimeter', 'Take a focused walk and return with one concrete next action.', 35, 'easy', 'Health'),
  ('Deep work gate', 'Complete one uninterrupted 45-minute work block.', 75, 'medium', 'Discipline'),
  ('Skill rep', 'Practice one skill deliberately and write down what improved.', 60, 'medium', 'Growth'),
  ('Boss room', 'Finish the task you have been avoiding and log the result.', 140, 'hard', 'Courage')
on conflict do nothing;

