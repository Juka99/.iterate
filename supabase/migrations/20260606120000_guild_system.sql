create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  emblem_url text,
  level integer not null default 1 check (level >= 1),
  total_xp integer not null default 0 check (total_xp >= 0),
  member_limit integer not null default 10 check (member_limit > 0),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_members (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'hunter' check (role in ('guild_master', 'captain', 'hunter')),
  joined_at timestamptz not null default now(),
  weekly_xp_contributed integer not null default 0 check (weekly_xp_contributed >= 0),
  total_xp_contributed integer not null default 0 check (total_xp_contributed >= 0),
  unique (user_id),
  unique (guild_id, user_id)
);

create table if not exists public.guild_activity (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  amount integer not null default 0,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_bosses (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  name text not null,
  max_hp integer not null check (max_hp > 0),
  current_hp integer not null check (current_hp >= 0),
  status text not null default 'active' check (status in ('active', 'defeated', 'expired')),
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_by uuid not null references auth.users(id) on delete cascade
);

create table if not exists public.guild_boss_contributions (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.guild_bosses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  damage integer not null check (damage > 0),
  source_challenge_id uuid references public.challenges(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_projects (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.guild_project_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.guild_projects(id) on delete cascade,
  category text not null,
  required_amount integer not null check (required_amount > 0),
  current_amount integer not null default 0 check (current_amount >= 0)
);

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_activity enable row level security;
alter table public.guild_bosses enable row level security;
alter table public.guild_boss_contributions enable row level security;
alter table public.guild_projects enable row level security;
alter table public.guild_project_requirements enable row level security;

create policy "Authenticated users can discover guilds"
on public.guilds for select
to authenticated
using (true);

create policy "Authenticated users can create guilds"
on public.guilds for insert
to authenticated
with check (auth.uid() = created_by);

create policy "Guild masters can update guild"
on public.guilds for update
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'guild_master'
  )
)
with check (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'guild_master'
  )
);

create policy "Guild members can update guild progress"
on public.guilds for update
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
      and guild_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Guild masters can delete guild"
on public.guilds for delete
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guilds.id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'guild_master'
  )
);

create policy "Authenticated users can read memberships"
on public.guild_members for select
to authenticated
using (true);

create policy "Users can join as themselves"
on public.guild_members for insert
to authenticated
with check (
  auth.uid() = user_id
  and (
    role = 'hunter'
    or exists (
      select 1 from public.guilds
      where guilds.id = guild_members.guild_id
        and guilds.created_by = auth.uid()
        and guild_members.role = 'guild_master'
    )
  )
);

create policy "Users can leave own guild"
on public.guild_members for delete
using (auth.uid() = user_id);

create policy "Members can update own contribution totals"
on public.guild_members for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Guild members can read activity"
on public.guild_activity for select
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_activity.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Members can add own activity"
on public.guild_activity for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_activity.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Guild members can read bosses"
on public.guild_bosses for select
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_bosses.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Leaders can start bosses"
on public.guild_bosses for insert
with check (
  auth.uid() = created_by
  and exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_bosses.guild_id
      and guild_members.user_id = auth.uid()
      and guild_members.role in ('guild_master', 'captain')
  )
);

create policy "Guild members can update active boss progress"
on public.guild_bosses for update
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_bosses.guild_id
      and guild_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_bosses.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Guild members can read boss contributions"
on public.guild_boss_contributions for select
using (
  exists (
    select 1 from public.guild_bosses
    join public.guild_members on guild_members.guild_id = guild_bosses.guild_id
    where guild_bosses.id = guild_boss_contributions.boss_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Members can add own boss contributions"
on public.guild_boss_contributions for insert
with check (auth.uid() = user_id);

create policy "Guild members can read projects"
on public.guild_projects for select
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_projects.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Leaders can start projects"
on public.guild_projects for insert
with check (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_projects.guild_id
      and guild_members.user_id = auth.uid()
      and guild_members.role in ('guild_master', 'captain')
  )
);

create policy "Guild members can read project requirements"
on public.guild_project_requirements for select
using (
  exists (
    select 1 from public.guild_projects
    join public.guild_members on guild_members.guild_id = guild_projects.guild_id
    where guild_projects.id = guild_project_requirements.project_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Leaders can create project requirements"
on public.guild_project_requirements for insert
with check (
  exists (
    select 1 from public.guild_projects
    join public.guild_members on guild_members.guild_id = guild_projects.guild_id
    where guild_projects.id = guild_project_requirements.project_id
      and guild_members.user_id = auth.uid()
      and guild_members.role in ('guild_master', 'captain')
  )
);

create policy "Guild members can update project requirements"
on public.guild_project_requirements for update
using (
  exists (
    select 1 from public.guild_projects
    join public.guild_members on guild_members.guild_id = guild_projects.guild_id
    where guild_projects.id = guild_project_requirements.project_id
      and guild_members.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.guild_projects
    join public.guild_members on guild_members.guild_id = guild_projects.guild_id
    where guild_projects.id = guild_project_requirements.project_id
      and guild_members.user_id = auth.uid()
  )
);
