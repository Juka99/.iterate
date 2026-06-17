create table if not exists public.guild_messages (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.guild_messages enable row level security;

create policy "Guild members can read messages"
on public.guild_messages for select
using (
  exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_messages.guild_id
      and guild_members.user_id = auth.uid()
  )
);

create policy "Guild members can send own messages"
on public.guild_messages for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.guild_members
    where guild_members.guild_id = guild_messages.guild_id
      and guild_members.user_id = auth.uid()
  )
);
