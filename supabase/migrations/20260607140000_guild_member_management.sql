create or replace function public.is_guild_master(target_guild_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.guild_members
    where guild_members.guild_id = target_guild_id
      and guild_members.user_id = auth.uid()
      and guild_members.role = 'guild_master'
  );
$$;

create or replace function public.prevent_unauthorized_guild_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role <> old.role and not public.is_guild_master(old.guild_id) then
    raise exception 'Only Guild Masters can change guild roles.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unauthorized_guild_role_change on public.guild_members;
create trigger prevent_unauthorized_guild_role_change
before update on public.guild_members
for each row execute function public.prevent_unauthorized_guild_role_change();

create policy "Guild masters can promote members"
on public.guild_members for update
using (public.is_guild_master(guild_id))
with check (public.is_guild_master(guild_id));

create policy "Guild masters can remove members"
on public.guild_members for delete
using (public.is_guild_master(guild_id));
