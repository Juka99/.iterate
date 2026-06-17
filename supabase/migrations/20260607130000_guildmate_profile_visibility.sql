create policy "Guild members can read guildmate profiles"
on public.profiles for select
to authenticated
using (
  auth.uid() = id
  or exists (
    select 1
    from public.guild_members viewer
    join public.guild_members guildmate
      on guildmate.guild_id = viewer.guild_id
    where viewer.user_id = auth.uid()
      and guildmate.user_id = profiles.id
  )
);
